const express = require('express');
const router = express.Router();
const { getStateStats } = require('../controllers/adminController');
const Story = require('../models/Story');
const User = require('../models/User');

router.get('/stats', getStateStats);

router.get('/:stateName', async (req, res) => {
  try {
    const state = decodeURIComponent(req.params.stateName);
    const [stories, contributors] = await Promise.all([
      Story.find({ state, status: 'approved' })
        .populate('category', 'name icon color')
        .populate('contributor', 'name username avatar')
        .sort('-views')
        .limit(20),
      User.find({ role: { $in: ['contributor', 'admin'] } })
        .sort('-storiesWritten')
        .limit(5)
        .select('name username avatar storiesWritten'),
    ]);
    const storyCount = await Story.countDocuments({ state, status: 'approved' });
    const featured = stories.find(s => s.isFeatured) || stories[0] || null;
    res.json({ success: true, data: { state, storyCount, stories, contributors, featured } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch state data.' });
  }
});

module.exports = router;
