// ─── Bookmark Controller ──────────────────────────────────
const { Bookmark, Rating, Notification, ReadingHistory } = require('../models/index');
const Story = require('../models/Story');
const User = require('../models/User');
const { checkAndAwardAchievements } = require('../utils/achievements');

// Bookmark Controller
exports.getBookmarks = async (req, res) => {
  try {
    const { collection } = req.query;
    const query = { user: req.user._id };
    if (collection) query.collection = collection;
    const bookmarks = await Bookmark.find(query)
      .populate({ path: 'story', populate: { path: 'category', select: 'name icon color' } })
      .sort('-createdAt');
    res.json({ success: true, data: bookmarks });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch bookmarks.' });
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { collection = 'All Bookmarks' } = req.body;
    const existing = await Bookmark.findOne({ user: req.user._id, story: storyId });
    if (existing) {
      await existing.deleteOne();
      await Story.findByIdAndUpdate(storyId, { $inc: { totalBookmarks: -1 } });
      return res.json({ success: true, bookmarked: false, message: 'Bookmark removed.' });
    }
    await Bookmark.create({ user: req.user._id, story: storyId, collection });
    await Story.findByIdAndUpdate(storyId, { $inc: { totalBookmarks: 1 } });
    res.json({ success: true, bookmarked: true, message: 'Bookmarked!' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle bookmark.' });
  }
};

exports.moveBookmark = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { collection } = req.body;
    const bookmark = await Bookmark.findOneAndUpdate(
      { user: req.user._id, story: storyId },
      { collection },
      { new: true }
    );
    if (!bookmark) return res.status(404).json({ success: false, message: 'Bookmark not found.' });
    res.json({ success: true, message: `Moved to ${collection}.`, data: bookmark });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to move bookmark.' });
  }
};

// Rating Controller
exports.rateStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { value } = req.body;
    if (!value || value < 1 || value > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be 1-5.' });
    }
    const rating = await Rating.findOneAndUpdate(
      { user: req.user._id, story: storyId },
      { value },
      { upsert: true, new: true }
    );
    // Recalculate average
    const all = await Rating.find({ story: storyId });
    const avg = all.reduce((s, r) => s + r.value, 0) / all.length;
    await Story.findByIdAndUpdate(storyId, {
      averageRating: Math.round(avg * 10) / 10,
      totalRatings: all.length,
    });
    res.json({ success: true, message: 'Rating saved.', data: { value: rating.value, average: Math.round(avg * 10) / 10, total: all.length } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to rate story.' });
  }
};

exports.getUserRating = async (req, res) => {
  try {
    const rating = await Rating.findOne({ user: req.user._id, story: req.params.storyId });
    res.json({ success: true, data: rating });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get rating.' });
  }
};

// Notification Controller
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { recipient: req.user._id };
    if (unreadOnly === 'true') query.isRead = false;
    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('sender', 'name username avatar')
        .sort('-createdAt')
        .skip(skip)
        .limit(Number(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: req.user._id, isRead: false }),
    ]);
    res.json({ success: true, data: notifications, unreadCount, pagination: { page: Number(page), total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch notifications.' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { ids } = req.body; // array of notification ids, or 'all'
    if (ids === 'all') {
      await Notification.updateMany({ recipient: req.user._id }, { isRead: true });
    } else {
      await Notification.updateMany({ _id: { $in: ids }, recipient: req.user._id }, { isRead: true });
    }
    res.json({ success: true, message: 'Marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to mark notifications.' });
  }
};

// Reading History Controller
exports.getReadingHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const history = await ReadingHistory.find({ user: req.user._id })
      .populate({ path: 'story', populate: { path: 'category', select: 'name icon' }, select: 'title slug coverImage state averageRating' })
      .sort('-readAt')
      .skip(skip)
      .limit(Number(limit));
    const total = await ReadingHistory.countDocuments({ user: req.user._id });
    res.json({ success: true, data: history, pagination: { page: Number(page), total } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reading history.' });
  }
};

exports.updateReadingProgress = async (req, res) => {
  try {
    const { storyId } = req.params;
    const { timeSpent, completed } = req.body;
    const entry = await ReadingHistory.findOneAndUpdate(
      { user: req.user._id, story: storyId },
      { $inc: { timeSpent: timeSpent || 0 }, completed: completed || false, readAt: new Date() },
      { upsert: true, new: true }
    );
    if (completed) {
      await User.findByIdAndUpdate(req.user._id, { $inc: { storiesRead: 1 } });
      // Check achievements asynchronously (fire and forget)
      checkAndAwardAchievements(req.user._id).catch(() => {});
    }
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update progress.' });
  }
};

// Story Like Controller
exports.toggleLikeStory = async (req, res) => {
  try {
    const { storyId } = req.params;
    const userId = req.user._id;
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ success: false, message: 'Story not found.' });

    const idx = story.likes.findIndex(id => id.toString() === userId.toString());
    const liked = idx === -1;
    if (liked) {
      story.likes.push(userId);
    } else {
      story.likes.splice(idx, 1);
    }
    story.likesCount = story.likes.length;
    await story.save();

    // Notify story contributor when liked (not self-like)
    if (liked && story.contributor.toString() !== userId.toString()) {
      await Notification.create({
        recipient: story.contributor,
        sender: userId,
        type: 'like',
        title: 'Someone liked your story',
        message: `${req.user.name} liked your story "${story.title}".`,
        link: `/stories/${story.slug}`,
      });
    }

    // Update contributor's likesReceived count
    const delta = liked ? 1 : -1;
    await User.findByIdAndUpdate(story.contributor, { $inc: { likesReceived: delta } });

    res.json({ success: true, liked, likesCount: story.likesCount });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to toggle like.' });
  }
};
