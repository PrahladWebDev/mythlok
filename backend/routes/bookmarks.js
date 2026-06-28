const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getBookmarks, toggleBookmark, moveBookmark } = require('../controllers/interactionController');
router.get('/', protect, getBookmarks);
router.post('/:storyId', protect, toggleBookmark);
router.patch('/:storyId/move', protect, moveBookmark);
module.exports = router;
