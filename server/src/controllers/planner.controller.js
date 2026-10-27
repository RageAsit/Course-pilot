const Assignment = require('../models/assignment.model');
const StudyPlan = require('../models/studyPlan.model');
const { prioritizeAssignments } = require('../services/priority.service');
const { generateStudyPlan } = require('../services/studyPlanner.service');
const { generatePlanSchema } = require('../validators/planner.validator');

/**
 * Calculate and return priority-ranked assignments for the current authenticated user
 * GET /api/planner/priorities
 */
const getPriorities = async (req, res, next) => {
  try {
    // Only query active, pending assignments for the authenticated student
    const assignments = await Assignment.find({
      user: req.user._id,
      status: 'pending',
    });

    const prioritized = prioritizeAssignments(assignments);

    res.status(200).json({
      success: true,
      count: prioritized.length,
      priorities: prioritized,
      assignments: prioritized,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate and persist an automatic study schedule for the authenticated student
 * POST /api/planner/generate
 */
const generatePlan = async (req, res, next) => {
  try {
    const validatedSettings = generatePlanSchema.parse(req.body || {});

    // Retrieve incomplete assignments for current user
    const assignments = await Assignment.find({
      user: req.user._id,
      status: 'pending',
    });

    // Run deterministic study scheduling algorithm
    const planResult = generateStudyPlan(assignments, validatedSettings);

    // Persist plan to MongoDB
    const persistedPlan = await StudyPlan.create({
      user: req.user._id,
      settings: planResult.settings,
      totalStudyMinutesScheduled: planResult.totalStudyMinutesScheduled,
      totalAssignmentsScheduled: planResult.totalAssignmentsScheduled,
      sessions: planResult.sessions,
      unscheduled: planResult.unscheduled,
      warnings: planResult.warnings,
    });

    res.status(201).json({
      success: true,
      message: 'Study schedule generated and saved successfully.',
      plan: {
        id: persistedPlan._id.toString(),
        settings: persistedPlan.settings,
        days: planResult.days,
        sessions: persistedPlan.sessions,
        unscheduled: persistedPlan.unscheduled,
        warnings: persistedPlan.warnings,
        totalStudyMinutesScheduled: persistedPlan.totalStudyMinutesScheduled,
        totalAssignmentsScheduled: persistedPlan.totalAssignmentsScheduled,
        createdAt: persistedPlan.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve the student's latest persisted study plan
 * GET /api/planner/current
 */
const getCurrentPlan = async (req, res, next) => {
  try {
    const latestPlan = await StudyPlan.findOne({
      user: req.user._id,
    }).sort({ createdAt: -1 });

    if (!latestPlan) {
      return res.status(200).json({
        success: true,
        plan: null,
      });
    }

    // Reconstruct daily grouping for presentation
    const groupedDays = {};
    for (const session of latestPlan.sessions) {
      const dStr = session.dateString;
      if (!groupedDays[dStr]) {
        groupedDays[dStr] = {
          dateString: dStr,
          date: session.date,
          usedMinutes: 0,
          sessions: [],
        };
      }
      groupedDays[dStr].sessions.push(session);
      groupedDays[dStr].usedMinutes += session.durationMinutes;
    }

    res.status(200).json({
      success: true,
      plan: {
        id: latestPlan._id.toString(),
        settings: latestPlan.settings,
        days: Object.values(groupedDays).sort(
          (a, b) => new Date(a.date) - new Date(b.date)
        ),
        sessions: latestPlan.sessions,
        unscheduled: latestPlan.unscheduled,
        warnings: latestPlan.warnings,
        totalStudyMinutesScheduled: latestPlan.totalStudyMinutesScheduled,
        totalAssignmentsScheduled: latestPlan.totalAssignmentsScheduled,
        createdAt: latestPlan.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPriorities,
  generatePlan,
  getCurrentPlan,
};
