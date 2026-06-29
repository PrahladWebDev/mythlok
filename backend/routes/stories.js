const express = require('express');
const router = express.Router();
const { protect, optionalAuth, isAdmin, isContributor } = require('../middleware/auth');
const ctrl = require('../controllers/storyController');

router.get('/',           optionalAuth, ctrl.getStories);
router.get('/trending',   ctrl.getTrending);
router.get('/featured',   ctrl.getFeatured);
router.post('/report',    protect, ctrl.reportContent);
router.get('/id/:id',     protect, ctrl.getStoryById);
router.get('/:slug',      optionalAuth, ctrl.getStory);
router.post('/',          protect, isContributor, ctrl.createStory);
router.put('/:id',        protect, ctrl.updateStory);
router.delete('/:id',     protect, ctrl.deleteStory);
router.patch('/:id/review', protect, isAdmin, ctrl.reviewStory);

module.exports = router;
