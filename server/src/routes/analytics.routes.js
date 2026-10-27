const express = require('express');
const { getAnalytics } = require('../controllers/analytics.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Require authentication for all analytics endpoints
router.use(authMiddleware);

router.get('/', getAnalytics);

module.exports = router;
