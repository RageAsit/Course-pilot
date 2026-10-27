const mongoose = require('mongoose');
const Assignment = require('../models/assignment.model');
const {
  createAssignmentSchema,
  updateAssignmentSchema,
} = require('../validators/assignment.validator');

/**
 * Validates MongoDB ObjectId format
 * @param {string} id
 * @returns {boolean}
 */
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

/**
 * Create a new assignment for authenticated user
 * POST /api/assignments
 */
const createAssignment = async (req, res, next) => {
  try {
    const validatedData = createAssignmentSchema.parse(req.body);

    const assignment = await Assignment.create({
      ...validatedData,
      user: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Assignment created successfully.',
      assignment: assignment.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all assignments for authenticated user with optional filtering
 * GET /api/assignments
 */
const getAssignments = async (req, res, next) => {
  try {
    const filter = { user: req.user._id };

    // Optional status filter ('pending' | 'completed')
    if (req.query.status) {
      if (['pending', 'completed'].includes(req.query.status)) {
        filter.status = req.query.status;
      }
    }

    // Optional subject filter
    if (req.query.subject && typeof req.query.subject === 'string') {
      filter.subject = new RegExp(req.query.subject.trim(), 'i');
    }

    const assignments = await Assignment.find(filter).sort({
      dueDate: 1,
      importance: -1,
    });

    res.status(200).json({
      success: true,
      count: assignments.length,
      assignments: assignments.map((a) => a.toJSON()),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single assignment by ID owned by authenticated user
 * GET /api/assignments/:id
 */
const getAssignmentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid assignment identifier format.',
          status: 400,
        },
      });
    }

    // Strictly scoped to authenticated user to prevent data leakage
    const assignment = await Assignment.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Assignment not found.',
          status: 404,
        },
      });
    }

    res.status(200).json({
      success: true,
      assignment: assignment.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update permitted assignment fields
 * PATCH /api/assignments/:id
 */
const updateAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid assignment identifier format.',
          status: 400,
        },
      });
    }

    const validatedData = updateAssignmentSchema.parse(req.body);

    const assignment = await Assignment.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Assignment not found.',
          status: 404,
        },
      });
    }

    // Check remainingMinutes vs estimatedMinutes constraint
    const newEstimated =
      validatedData.estimatedMinutes !== undefined
        ? validatedData.estimatedMinutes
        : assignment.estimatedMinutes;

    const newRemaining =
      validatedData.remainingMinutes !== undefined
        ? validatedData.remainingMinutes
        : assignment.remainingMinutes;

    if (newRemaining > newEstimated) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Remaining minutes cannot exceed estimated minutes.',
          status: 400,
        },
      });
    }

    // Apply updates
    Object.assign(assignment, validatedData);
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment updated successfully.',
      assignment: assignment.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark assignment as completed
 * PATCH /api/assignments/:id/complete
 */
const completeAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid assignment identifier format.',
          status: 400,
        },
      });
    }

    const assignment = await Assignment.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Assignment not found.',
          status: 404,
        },
      });
    }

    assignment.status = 'completed';
    assignment.remainingMinutes = 0;
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment marked as completed.',
      assignment: assignment.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reopen a completed assignment
 * PATCH /api/assignments/:id/reopen
 */
const reopenAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid assignment identifier format.',
          status: 400,
        },
      });
    }

    const assignment = await Assignment.findOne({
      _id: id,
      user: req.user._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Assignment not found.',
          status: 404,
        },
      });
    }

    assignment.status = 'pending';
    // If remaining minutes was set to 0 on completion, restore it to estimated minutes
    if (assignment.remainingMinutes === 0) {
      assignment.remainingMinutes = assignment.estimatedMinutes;
    }
    await assignment.save();

    res.status(200).json({
      success: true,
      message: 'Assignment reopened.',
      assignment: assignment.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete an assignment
 * DELETE /api/assignments/:id
 */
const deleteAssignment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid assignment identifier format.',
          status: 400,
        },
      });
    }

    const assignment = await Assignment.findOneAndDelete({
      _id: id,
      user: req.user._id,
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        error: {
          message: 'Assignment not found.',
          status: 404,
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Assignment deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  updateAssignment,
  completeAssignment,
  reopenAssignment,
  deleteAssignment,
};
