const express = require('express');
const {
  getPriorities,
  generatePlan,
  getCurrentPlan,
} = require('../controllers/planner.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Enforce authentication on all planner operations
router.use(authMiddleware);

router.get('/priorities', getPriorities);
router.post('/generate', generatePlan);
router.get('/current', getCurrentPlan);

module.exports = router;
