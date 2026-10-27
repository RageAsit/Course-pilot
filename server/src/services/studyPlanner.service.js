const { prioritizeAssignments } = require('./priority.service');

/**
 * Calculates calendar day difference in UTC to guarantee timezone independence
 * @param {Date|string} targetDate
 * @param {Date|string} baseDate
 * @returns {number} Integer day difference (negative if targetDate < baseDate)
 */
const getCalendarDiffDays = (targetDate, baseDate) => {
  const t = new Date(targetDate);
  const b = new Date(baseDate);
  const utcTarget = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  const utcBase = Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate());
  return Math.floor((utcTarget - utcBase) / (1000 * 60 * 60 * 24));
};

/**
 * Generates an optimized, deterministic study schedule
 *
 * @param {Array<Object>} assignments Raw incomplete assignments for student
 * @param {Object} options Configuration parameters
 * @param {Date|string} [options.startDate=new Date()] Planning start date
 * @param {number} [options.horizonDays=7] Number of days to schedule (1–30)
 * @param {number} [options.dailyCapacityMinutes=180] Available study minutes per day (15–720)
 * @param {number} [options.preferredSessionMinutes=45] Ideal study block length (15–180)
 * @returns {Object} Structured study plan containing daily schedule, sessions, unscheduled tasks, and warnings
 */
const generateStudyPlan = (assignments, options = {}) => {
  const horizonDays = Math.min(30, Math.max(1, parseInt(options.horizonDays, 10) || 7));
  const dailyCapacityMinutes = Math.min(
    720,
    Math.max(15, parseInt(options.dailyCapacityMinutes, 10) || 180)
  );
  const preferredSessionMinutes = Math.min(
    180,
    Math.max(15, parseInt(options.preferredSessionMinutes, 10) || 45)
  );

  // Normalize start date
  const start = options.startDate ? new Date(options.startDate) : new Date();

  // Initialize day buckets
  const days = [];
  for (let i = 0; i < horizonDays; i++) {
    const dayDate = new Date(start);
    dayDate.setUTCDate(dayDate.getUTCDate() + i);
    const dateString = dayDate.toISOString().split('T')[0];

    days.push({
      index: i,
      date: dayDate,
      dateString,
      capacityMinutes: dailyCapacityMinutes,
      availableMinutes: dailyCapacityMinutes,
      usedMinutes: 0,
      sessions: [],
    });
  }

  // Filter out completed tasks and prioritize active ones
  const activeAssignments = (assignments || []).filter(
    (a) => a.status !== 'completed' && (a.remainingMinutes === undefined || a.remainingMinutes > 0)
  );

  const prioritized = prioritizeAssignments(activeAssignments, start);

  const warnings = [];
  const unscheduled = [];
  const allSessions = [];
  const scheduledAssignmentIds = new Set();

  for (const task of prioritized) {
    const remainingToSchedule =
      typeof task.remainingMinutes === 'number'
        ? task.remainingMinutes
        : task.estimatedMinutes || 60;

    let unallocated = remainingToSchedule;

    // Determine deadline boundary using UTC calendar day difference
    let maxDayIndex = horizonDays - 1;
    let isTaskOverdue = false;

    if (task.dueDate) {
      const diffDays = getCalendarDiffDays(task.dueDate, start);

      if (diffDays < 0) {
        // Task is already past due!
        isTaskOverdue = true;
        warnings.push(
          `Overdue Notice: Assignment "${task.title}" was due on ${new Date(task.dueDate).toLocaleDateString()}. Prioritized for immediate completion.`
        );
      } else {
        // Due within or beyond horizon
        maxDayIndex = Math.min(diffDays, horizonDays - 1);
      }
    }

    // Allocate sessions across days
    while (unallocated > 0) {
      const desiredChunk = Math.min(preferredSessionMinutes, unallocated);

      // Search for an eligible day before the deadline
      let bestDay = null;

      // 1. First pass: find earliest day that can fit the full desired chunk
      for (let d = 0; d <= maxDayIndex; d++) {
        if (days[d].availableMinutes >= desiredChunk) {
          bestDay = days[d];
          break;
        }
      }

      // 2. Second pass: if no day fits full chunk, take the day with the most available minutes (> 0)
      if (!bestDay) {
        let maxAvailable = 0;
        for (let d = 0; d <= maxDayIndex; d++) {
          if (days[d].availableMinutes > maxAvailable) {
            maxAvailable = days[d].availableMinutes;
            bestDay = days[d];
          }
        }
      }

      // If no day before deadline has ANY capacity remaining:
      if (!bestDay || bestDay.availableMinutes === 0) {
        const dueDateFormatted = task.dueDate
          ? new Date(task.dueDate).toLocaleDateString()
          : 'deadline';

        const reason = isTaskOverdue
          ? `Study schedule is at full capacity. Remaining ${unallocated}m could not be slotted.`
          : `Capacity conflict: Could not schedule ${unallocated}m before deadline on ${dueDateFormatted}.`;

        unscheduled.push({
          assignment: task.id || task._id,
          title: task.title,
          subject: task.subject,
          remainingMinutes: unallocated,
          reason,
        });

        warnings.push(
          `Capacity Conflict: ${unallocated} mins unscheduled for "${task.title}" before ${dueDateFormatted}.`
        );
        break; // Stop attempting to schedule this assignment
      }

      // Allocate time in bestDay
      const sessionMinutes = Math.min(desiredChunk, bestDay.availableMinutes);
      const session = {
        assignment: task.id || task._id,
        title: task.title,
        subject: task.subject,
        date: bestDay.date,
        dateString: bestDay.dateString,
        durationMinutes: sessionMinutes,
        order: bestDay.sessions.length + 1,
      };

      bestDay.sessions.push(session);
      bestDay.usedMinutes += sessionMinutes;
      bestDay.availableMinutes -= sessionMinutes;
      allSessions.push(session);
      scheduledAssignmentIds.add(String(task.id || task._id));

      unallocated -= sessionMinutes;
    }
  }

  // Summary statistics
  const totalStudyMinutesScheduled = allSessions.reduce(
    (acc, s) => acc + s.durationMinutes,
    0
  );

  return {
    settings: {
      startDate: start,
      horizonDays,
      dailyCapacityMinutes,
      preferredSessionMinutes,
    },
    days: days.map((d) => ({
      date: d.date,
      dateString: d.dateString,
      capacityMinutes: d.capacityMinutes,
      usedMinutes: d.usedMinutes,
      availableMinutes: d.availableMinutes,
      sessionCount: d.sessions.length,
      sessions: d.sessions,
    })),
    sessions: allSessions,
    unscheduled,
    warnings,
    totalStudyMinutesScheduled,
    totalAssignmentsScheduled: scheduledAssignmentIds.size,
  };
};

module.exports = {
  generateStudyPlan,
  getCalendarDiffDays,
};
