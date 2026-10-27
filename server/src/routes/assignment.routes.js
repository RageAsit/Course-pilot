const express = require('express');
const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  completeAssignment,
  reopenAssignment,
  deleteAssignment,
} = require('../controllers/assignment.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

// Enforce authentication across all assignment endpoints
router.use(authMiddleware);

router.route('/')
  .post(createAssignment)
  .get(getAssignments);

router.route('/:id')
  .get(getAssignmentById)
  .patch(updateAssignment)
  .delete(deleteAssignment);

router.patch('/:id/complete', completeAssignment);
router.patch('/:id/reopen', reopenAssignment);

module.exports = router;
