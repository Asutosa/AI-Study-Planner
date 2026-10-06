const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const { getRecommendations } = require('../controllers/aiController');

const router = express.Router();

router.post('/recommendations', authMiddleware, getRecommendations);

module.exports = router;
