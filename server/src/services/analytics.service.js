const Assignment = require('../models/assignment.model');
const StudyPlan = require('../models/studyPlan.model');
const { calculatePriority } = require('./priority.service');

/**
 * Computes comprehensive productivity analytics for an authenticated student
 * using their real MongoDB Atlas assignments and study plans.
 *
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @param {Date} [referenceDate=new Date()]
 * @returns {Promise<Object>} Analytics metrics payload
 */
const getStudentAnalytics = async (userId, referenceDate = new Date()) => {
  const now = new Date(referenceDate);

  // 1. Fetch all assignments belonging to the student
  const assignments = await Assignment.find({ user: userId }).lean();

  // 2. Fetch the student's latest persisted study plan
  const latestPlan = await StudyPlan.findOne({ user: userId })
    .sort({ createdAt: -1 })
    .lean();

  // Basic counters
  const total = assignments.length;
  let pendingCount = 0;
  let completedCount = 0;
  let overdueCount = 0;
  let totalEstimatedMinutes = 0;
  let totalRemainingMinutes = 0;
  let completedMinutes = 0;

  // Groupings
  const subjectMap = {};
  const priorityBuckets = {
    high: 0, // 75–100
    medium: 0, // 50–74
    low: 0, // 0–49
  };

  const upcomingDeadlines = {
    dueToday: 0,
    dueNext3Days: 0,
    dueNext7Days: 0,
    beyond7Days: 0,
  };

  const completionDatesMap = {};

  for (const a of assignments) {
    const est = a.estimatedMinutes || 60;
    const rem = typeof a.remainingMinutes === 'number' ? a.remainingMinutes : est;
    totalEstimatedMinutes += est;

    // Track subject workload
    const subj = a.subject ? a.subject.trim().toUpperCase() : 'GENERAL';
    if (!subjectMap[subj]) {
      subjectMap[subj] = {
        subject: subj,
        totalCount: 0,
        pendingCount: 0,
        completedCount: 0,
        remainingMinutes: 0,
        estimatedMinutes: 0,
      };
    }
    subjectMap[subj].totalCount += 1;
    subjectMap[subj].estimatedMinutes += est;

    if (a.status === 'completed') {
      completedCount += 1;
      completedMinutes += est;
      subjectMap[subj].completedCount += 1;

      // Group completion by date
      if (a.updatedAt) {
        const dStr = new Date(a.updatedAt).toISOString().split('T')[0];
        if (!completionDatesMap[dStr]) {
          completionDatesMap[dStr] = { date: dStr, completedCount: 0, minutes: 0 };
        }
        completionDatesMap[dStr].completedCount += 1;
        completionDatesMap[dStr].minutes += est;
      }
    } else {
      pendingCount += 1;
      totalRemainingMinutes += rem;
      subjectMap[subj].pendingCount += 1;
      subjectMap[subj].remainingMinutes += rem;

      // Check overdue and deadline urgency
      if (a.dueDate) {
        const due = new Date(a.dueDate);
        const diffMs = due.getTime() - now.getTime();
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 0) {
          overdueCount += 1;
        } else if (diffHours <= 24) {
          upcomingDeadlines.dueToday += 1;
        } else if (diffHours <= 72) {
          upcomingDeadlines.dueNext3Days += 1;
        } else if (diffHours <= 168) {
          upcomingDeadlines.dueNext7Days += 1;
        } else {
          upcomingDeadlines.beyond7Days += 1;
        }
      }

      // Priority distribution
      const pri = calculatePriority(a, now);
      if (pri.score >= 75) {
        priorityBuckets.high += 1;
      } else if (pri.score >= 50) {
        priorityBuckets.medium += 1;
      } else {
        priorityBuckets.low += 1;
      }
    }
  }

  const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  // Format workload by subject for charts
  const workloadBySubject = Object.values(subjectMap).sort(
    (a, b) => b.remainingMinutes - a.remainingMinutes
  );

  // Format completion trend timeline
  const completionHistory = Object.values(completionDatesMap).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  // Study plan metrics
  let planMetrics = {
    hasActivePlan: false,
    totalScheduledMinutes: 0,
    totalUnscheduledMinutes: 0,
    scheduledSessionsCount: 0,
    dailyCapacityMinutes: 180,
    warningsCount: 0,
    dailyUtilization: [],
  };

  if (latestPlan) {
    const unscheduledMins = (latestPlan.unscheduled || []).reduce(
      (acc, u) => acc + (u.remainingMinutes || 0),
      0
    );

    const dailyUtilization = (latestPlan.days || []).map((d) => {
      const cap = d.capacityMinutes || latestPlan.settings?.dailyCapacityMinutes || 180;
      const used = d.usedMinutes || 0;
      return {
        dateString: d.dateString,
        usedMinutes: used,
        capacityMinutes: cap,
        sessionsCount: d.sessions ? d.sessions.length : 0,
        utilizationRate: cap > 0 ? Math.min(100, Math.round((used / cap) * 100)) : 0,
      };
    });

    planMetrics = {
      hasActivePlan: true,
      planId: latestPlan._id,
      totalScheduledMinutes: latestPlan.totalStudyMinutesScheduled || 0,
      totalUnscheduledMinutes: unscheduledMins,
      scheduledSessionsCount: latestPlan.sessions ? latestPlan.sessions.length : 0,
      dailyCapacityMinutes: latestPlan.settings?.dailyCapacityMinutes || 180,
      warningsCount: latestPlan.warnings ? latestPlan.warnings.length : 0,
      dailyUtilization,
    };
  }

  return {
    overview: {
      totalAssignments: total,
      pendingAssignments: pendingCount,
      completedAssignments: completedCount,
      completionRate,
      overdueCount,
      totalEstimatedMinutes,
      totalRemainingMinutes,
      completedMinutes,
    },
    workloadBySubject,
    priorityDistribution: [
      { name: 'High Priority (75–100)', count: priorityBuckets.high, fill: '#f43f5e' },
      { name: 'Medium Priority (50–74)', count: priorityBuckets.medium, fill: '#f59e0b' },
      { name: 'Low Priority (0–49)', count: priorityBuckets.low, fill: '#3b82f6' },
    ],
    upcomingDeadlines,
    completionHistory,
    planMetrics,
  };
};

module.exports = {
  getStudentAnalytics,
};
