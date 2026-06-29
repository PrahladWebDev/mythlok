const Story = require('../models/Story');
const { Rating, Bookmark, ReadingHistory, Notification, Report } = require('../models/index');
const User = require('../models/User');
const { checkAndAwardAchievements } = require('../utils/achievements');

// ─── Helper: compute & update story rating ────────────────
const updateStoryRating = async (storyId) => {
  const ratings = await Rating.find({ story: storyId });
  if (!ratings.length) return;
  const avg = ratings.reduce((s, r) => s + r.value, 0) / ratings.length;
  await Story.findByIdAndUpdate(storyId, {
    averageRating: Math.round(avg * 10) / 10,
    totalRatings: ratings.length,
  });
};

// ─── GET /stories  ────────────────────────────────────────
exports.getStories = async (req, res) => {
  try {
    const {
      page = 1, limit = 12, state, category, status = 'approved',
      search, sort = '-createdAt', featured, tag,
    } = req.query;

    const query = {};

    // Public only sees approved unless admin/contributor checking own
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      if (status === 'all' && req.user) {
        // contributor viewing all their own stories (any status)
        query.contributor = req.user._id;
      } else if (status === 'approved') {
        query.status = 'approved';
      } else if (req.user && status) {
        query.status = status;
        query.contributor = req.user._id;
      } else {
        query.status = 'approved';
      }
    } else if (status && status !== 'all') {
      query.status = status;
    }

    if (state)    query.state = state;
    if (category) query.category = category;
    if (featured) query.isFeatured = true;
    if (tag)      query.tags = tag.toLowerCase();

    if (search) {
      query.$text = { $search: search };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const sortObj = sort.startsWith('-')
      ? { [sort.slice(1)]: -1 }
      : { [sort]: 1 };

    const [stories, total] = await Promise.all([
      Story.find(query)
        .populate('category', 'name slug icon color')
        .populate('contributor', 'name username avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Story.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: stories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stories.' });
  }
};

// ─── GET /stories/:slug ───────────────────────────────────
exports.getStory = async (req, res) => {
  try {
    const { slug } = req.params;
    const story = await Story.findOne({ slug })
      .populate('category', 'name slug icon color')
      .populate('contributor', 'name username avatar bio')
      .populate('reviewedBy', 'name username');

    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found.' });
    }

    // Only show non-approved to admin or owner
    if (story.status !== 'approved') {
      const isAdmin = req.user?.role === 'admin';
      const isOwner = req.user?._id.toString() === story.contributor._id.toString();
      if (!isAdmin && !isOwner) {
        return res.status(404).json({ success: false, message: 'Story not found.' });
      }
    }

    // Increment view count
    await Story.findByIdAndUpdate(story._id, { $inc: { views: 1 } });

    // Track reading history if logged in
    if (req.user) {
      // Atomic upsert — $setOnInsert only runs when a new doc is created
      const historyResult = await ReadingHistory.collection.updateOne(
        { user: req.user._id, story: story._id },
        {
          $set: { readAt: new Date() },
          $setOnInsert: { timeSpent: 0, completed: false },
        },
        { upsert: true }
      );

      // upsertedCount === 1 means first-ever read, guaranteed atomic
      if (historyResult.upsertedCount === 1) {
        await User.findByIdAndUpdate(req.user._id, { $inc: { storiesRead: 1 } });
        checkAndAwardAchievements(req.user._id).catch(() => {});
      }

      // Track state exploration
      if (!req.user.statesExplored.includes(story.state)) {
        await User.findByIdAndUpdate(req.user._id, {
          $addToSet: { statesExplored: story.state },
        });
      }
    }

    // Related stories
    const related = await Story.find({
      status: 'approved',
      _id: { $ne: story._id },
      $or: [{ state: story.state }, { category: story.category }],
    })
      .populate('category', 'name slug icon')
      .select('title slug coverImage state averageRating views')
      .limit(4)
      .lean();

    res.json({ success: true, data: { ...story.toObject(), related } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch story.' });
  }
};

// ─── POST /stories ────────────────────────────────────────
exports.createStory = async (req, res) => {
  try {
    const {
      title, alternativeNames, state, district, category,
      shortDescription, fullStory, origin, significance,
      tags, references, coverImage, status, lat, lng,
    } = req.body;

    const isDraft = status === 'draft';

    const storyData = {
      title,
      alternativeNames: alternativeNames || [],
      state,
      district,
      category,
      shortDescription,
      fullStory,
      origin: origin || '',
      significance: significance || '',
      coverImage: coverImage || {},
      tags: tags || [],
      references: references || [],
      contributor: req.user._id,
      status: isDraft ? 'draft' : 'pending',
    };

    // Only set location when valid coords are provided
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)
        && parsedLat >= -90 && parsedLat <= 90
        && parsedLng >= -180 && parsedLng <= 180) {
      storyData.location = { type: 'Point', coordinates: [parsedLng, parsedLat] };
    }

    const story = await Story.create(storyData);

    await story.populate('category', 'name slug icon color');

    if (!isDraft) {
      // Notify admins
      const admins = await User.find({ role: 'admin' }, '_id');
      const notifications = admins.map(admin => ({
        recipient: admin._id,
        sender: req.user._id,
        type: 'story_approved', // reuse, or you could add 'story_submitted'
        title: 'New Story Submitted',
        message: `${req.user.name} submitted "${title}" for review.`,
        link: `/admin?tab=pending`,
      }));
      if (notifications.length) {
        const { Notification } = require('../models/index');
        await Notification.insertMany(notifications);
      }
    }

    res.status(201).json({ success: true, message: isDraft ? 'Draft saved.' : 'Story submitted for review.', data: story });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ success: false, message: messages.join('. ') });
    }
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to create story.' });
  }
};

// ─── PUT /stories/:id ─────────────────────────────────────
exports.updateStory = async (req, res) => {
  try {
    let story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found.' });

    const isOwner = story.contributor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this story.' });
    }

    // Owner can only edit draft/rejected/changes_requested
    if (isOwner && !isAdmin) {
      if (!['draft', 'rejected', 'changes_requested'].includes(story.status)) {
        return res.status(400).json({ success: false, message: 'Cannot edit a story that is pending or approved.' });
      }
    }

    const updates = { ...req.body };

    // Coerce lat/lng → GeoJSON location
    if (req.body.lat !== undefined || req.body.lng !== undefined) {
      const parsedLat = parseFloat(req.body.lat);
      const parsedLng = parseFloat(req.body.lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)
          && parsedLat >= -90 && parsedLat <= 90
          && parsedLng >= -180 && parsedLng <= 180) {
        updates.location = { type: 'Point', coordinates: [parsedLng, parsedLat] };
      }
      delete updates.lat;
      delete updates.lng;
    }

    if (updates.status === 'pending' && !isAdmin) {
      updates.status = 'pending'; // allow re-submit
    }

    story = await Story.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true })
      .populate('category', 'name slug icon color')
      .populate('contributor', 'name username avatar');

    res.json({ success: true, message: 'Story updated.', data: story });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update story.' });
  }
};

// ─── DELETE /stories/:id ──────────────────────────────────
exports.deleteStory = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found.' });

    const isOwner = story.contributor.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    await story.deleteOne();
    // Cascade deletes
    await Promise.all([
      Rating.deleteMany({ story: story._id }),
      Bookmark.deleteMany({ story: story._id }),
      ReadingHistory.deleteMany({ story: story._id }),
    ]);

    res.json({ success: true, message: 'Story deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete story.' });
  }
};

// ─── PATCH /stories/:id/review (admin) ───────────────────
exports.reviewStory = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const validStatuses = ['approved', 'rejected', 'changes_requested'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }

    const story = await Story.findByIdAndUpdate(
      req.params.id,
      { status, adminNote: adminNote || '', reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    ).populate('contributor', 'name _id');

    if (!story) return res.status(404).json({ success: false, message: 'Story not found.' });

    // Update contributor's story count
    if (status === 'approved') {
      await User.findByIdAndUpdate(story.contributor._id, { $inc: { storiesWritten: 1 } });
      checkAndAwardAchievements(story.contributor._id).catch(() => {});
    }

    // Notify contributor
    const messages = {
      approved: `🎉 Your story "${story.title}" has been approved and is now live!`,
      rejected: `Your story "${story.title}" was rejected. ${adminNote ? 'Reason: ' + adminNote : ''}`,
      changes_requested: `Changes requested for "${story.title}". ${adminNote || ''}`,
    };

    await Notification.create({
      recipient: story.contributor._id,
      sender: req.user._id,
      type: `story_${status}`.replace('story_approved', 'story_approved'),
      title: status === 'approved' ? 'Story Approved!' : status === 'rejected' ? 'Story Rejected' : 'Changes Requested',
      message: messages[status],
      link: `/stories/${story.slug}`,
    });

    res.json({ success: true, message: `Story ${status}.`, data: story });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Review failed.' });
  }
};

// ─── GET /stories/trending ────────────────────────────────
exports.getTrending = async (req, res) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const stories = await Story.find({ status: 'approved', updatedAt: { $gte: since } })
      .populate('category', 'name slug icon color')
      .populate('contributor', 'name username avatar')
      .sort('-views -averageRating')
      .limit(8)
      .lean();
    res.json({ success: true, data: stories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch trending.' });
  }
};

// ─── GET /stories/featured ────────────────────────────────
exports.getFeatured = async (req, res) => {
  try {
    const stories = await Story.find({ status: 'approved', isFeatured: true })
      .populate('category', 'name slug icon color')
      .populate('contributor', 'name username avatar')
      .sort('-views')
      .limit(5)
      .lean();
    res.json({ success: true, data: stories });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch featured.' });
  }
};

// ─── POST /stories/report ─────────────────────────────────
exports.reportContent = async (req, res) => {
  try {
    const { targetId, targetType, reason, description } = req.body;
    if (!targetId || !targetType || !reason) {
      return res.status(400).json({ success: false, message: 'targetId, targetType, and reason are required.' });
    }
    const existing = await Report.findOne({ reporter: req.user._id, targetId, targetType });
    if (existing) {
      return res.status(409).json({ success: false, message: 'You have already reported this content.' });
    }
    await Report.create({ reporter: req.user._id, targetId, targetType, reason, description: description || '' });
    res.status(201).json({ success: true, message: 'Report submitted. Thank you!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
};
