/**
 * Priority Scoring Engine for CoursePilot
 * Deterministically ranks assignments based on deadline urgency, importance,
 * remaining effort, and overdue status.
 */

/**
 * Calculates priority score (0–100) and factor breakdown for an assignment
 * @param {Object} assignment Mongoose assignment document or plain object
 * @param {Date} [referenceDate=new Date()] Reference baseline time (defaults to now)
 * @returns {{ score: number, breakdown: Object, summary: string, isOverdue: boolean }}
 */
const calculatePriority = (assignment, referenceDate = new Date()) => {
  // 1. Completed assignments are inactive
  if (assignment.status === 'completed') {
    return {
      score: 0,
      breakdown: {
        urgency: 0,
        importance: 0,
        effort: 0,
        overdue: 0,
      },
      summary: 'Assignment is completed (0/100).',
      isOverdue: false,
    };
  }

  const now = new Date(referenceDate);
  const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null;
  const isValidDate = dueDate && !isNaN(dueDate.getTime());

  let urgencyScore = 10;
  let overduePenalty = 0;
  let isOverdue = false;
  let hoursRemaining = 72;

  // 2. Deadline Urgency (Strictly 0–40) & Overdue Penalty (Strictly 0–10)
  if (!isValidDate) {
    urgencyScore = 10; // Default median baseline for missing/unparseable dates
  } else {
    const diffMs = dueDate.getTime() - now.getTime();
    hoursRemaining = diffMs / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      // Overdue: Full 40 urgency points plus overdue bonus
      isOverdue = true;
      urgencyScore = 40;
      const overdueHours = Math.abs(Math.floor(hoursRemaining));
      // Base penalty 5 points + 1 point per 24h overdue, capped at 10
      overduePenalty = Math.min(10, 5 + Math.min(5, Math.floor(overdueHours / 24)));
    } else if (hoursRemaining <= 24) {
      // Due within 24 hours: 30 to 40 points
      urgencyScore = Math.min(40, Math.round(40 - (hoursRemaining / 24) * 10));
    } else if (hoursRemaining <= 72) {
      // Due within 3 days: 20 to 30 points
      urgencyScore = Math.min(30, Math.round(30 - ((hoursRemaining - 24) / 48) * 10));
    } else if (hoursRemaining <= 168) {
      // Due within 7 days: 10 to 20 points
      urgencyScore = Math.min(20, Math.round(20 - ((hoursRemaining - 72) / 96) * 10));
    } else {
      // Beyond 7 days: 1 to 10 points
      urgencyScore = Math.max(
        1,
        Math.min(10, Math.round(10 - ((hoursRemaining - 168) / 336) * 9))
      );
    }
  }

  // Ensure bounds for urgency and overdue
  urgencyScore = Math.min(40, Math.max(0, urgencyScore));
  overduePenalty = Math.min(10, Math.max(0, overduePenalty));

  // 3. Importance Factor (Strictly 6–30 for ratings 1–5)
  const rawImportance = parseInt(assignment.importance, 10) || 3;
  const clampedImportance = Math.min(5, Math.max(1, rawImportance));
  const importanceScore = clampedImportance * 6; // 1->6, 2->12, 3->18, 4->24, 5->30

  // 4. Remaining Effort Factor (Strictly 0–20)
  const remainingMinutes =
    typeof assignment.remainingMinutes === 'number'
      ? assignment.remainingMinutes
      : assignment.estimatedMinutes || 60;

  let effortScore = 0;
  if (remainingMinutes > 0) {
    // 300 minutes (5 hours) reaches maximum effort weight of 20
    effortScore = Math.min(20, Math.max(1, Math.round((remainingMinutes / 300) * 20)));
  }

  // 5. Total Combined Score (Clamped to 0–100)
  // Max possible sum: 40 + 30 + 20 + 10 = 100
  const totalScore = Math.min(
    100,
    Math.max(0, urgencyScore + importanceScore + effortScore + overduePenalty)
  );

  // 6. Natural Language Explanation Summary
  let summary = '';
  if (isOverdue) {
    const overdueHours = Math.abs(Math.floor(hoursRemaining));
    summary = `OVERDUE by ${overdueHours}h: Urgency (${urgencyScore}/40) + Overdue Bonus (${overduePenalty}/10) + Importance (${importanceScore}/30) + Effort (${effortScore}/20) = ${totalScore}/100 pts.`;
  } else if (hoursRemaining <= 24) {
    const hrs = Math.max(1, Math.round(hoursRemaining));
    summary = `Critical: Due in ${hrs}h. Urgency (${urgencyScore}/40) + Importance (${importanceScore}/30) + Effort (${effortScore}/20) = ${totalScore}/100 pts.`;
  } else if (hoursRemaining <= 72) {
    const days = Math.round(hoursRemaining / 24);
    summary = `Upcoming: Due in ${days} days. Urgency (${urgencyScore}/40) + Importance (${importanceScore}/30) + Effort (${effortScore}/20) = ${totalScore}/100 pts.`;
  } else {
    const days = Math.round(hoursRemaining / 24);
    summary = `Scheduled: Due in ${days} days. Urgency (${urgencyScore}/40) + Importance (${importanceScore}/30) + Effort (${effortScore}/20) = ${totalScore}/100 pts.`;
  }

  return {
    score: totalScore,
    breakdown: {
      urgency: urgencyScore,
      importance: importanceScore,
      effort: effortScore,
      overdue: overduePenalty,
      hoursRemaining: isValidDate ? Math.round(hoursRemaining * 10) / 10 : null,
    },
    summary,
    isOverdue,
  };
};

/**
 * Calculates priorities for an array of assignments and returns them in ranked order
 * with deterministic stable tie-breaking:
 * 1. Score DESC
 * 2. Due Date ASC
 * 3. Importance DESC
 * 4. Identifier ASC
 *
 * @param {Array<Object>} assignments
 * @param {Date} [referenceDate=new Date()]
 * @returns {Array<Object>}
 */
const prioritizeAssignments = (assignments, referenceDate = new Date()) => {
  return assignments
    .map((assignment) => {
      const plain = assignment.toJSON ? assignment.toJSON() : { ...assignment };
      const priorityInfo = calculatePriority(plain, referenceDate);
      return {
        ...plain,
        priorityScore: priorityInfo.score,
        priorityBreakdown: priorityInfo.breakdown,
        prioritySummary: priorityInfo.summary,
        isOverdue: priorityInfo.isOverdue,
        priorityExplanation: {
          score: priorityInfo.score,
          urgencyScore: priorityInfo.breakdown.urgency,
          importanceScore: priorityInfo.breakdown.importance,
          effortScore: priorityInfo.breakdown.effort,
          overdueBonus: priorityInfo.breakdown.overdue,
          hoursRemaining: priorityInfo.breakdown.hoursRemaining,
          summary: priorityInfo.summary,
          isOverdue: priorityInfo.isOverdue,
        },
      };
    })
    .sort((a, b) => {
      // 1. Priority Score descending
      if (b.priorityScore !== a.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      // 2. Due Date ascending (earliest deadline first)
      const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      // 3. Importance descending
      const impA = a.importance || 3;
      const impB = b.importance || 3;
      if (impB !== impA) {
        return impB - impA;
      }
      // 4. Stable tie-break by ID
      const idA = String(a.id || a._id || '');
      const idB = String(b.id || b._id || '');
      return idA.localeCompare(idB);
    });
};

module.exports = {
  calculatePriority,
  prioritizeAssignments,
};
