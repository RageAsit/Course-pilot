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

  let urgencyScore = 15;
  let overduePenalty = 0;
  let isOverdue = false;
  let hoursRemaining = 72;

  // 2. Deadline Urgency (Max 45) & Overdue Penalty (Max 10)
  if (!isValidDate) {
    urgencyScore = 15; // Default median urgency for invalid dates
  } else {
    const diffMs = dueDate.getTime() - now.getTime();
    hoursRemaining = diffMs / (1000 * 60 * 60);

    if (hoursRemaining < 0) {
      // Overdue
      isOverdue = true;
      urgencyScore = 45; // Full urgency
      const overdueHours = Math.abs(Math.floor(hoursRemaining));
      // Base penalty 5, plus up to 5 additional points for multi-day overdue
      overduePenalty = Math.min(10, 5 + Math.min(5, Math.floor(overdueHours / 24)));
    } else if (hoursRemaining <= 24) {
      // Due within 24 hours: 33 to 45 points
      urgencyScore = Math.round(45 - (hoursRemaining / 24) * 12);
    } else if (hoursRemaining <= 72) {
      // Due within 3 days: 21 to 33 points
      urgencyScore = Math.round(33 - ((hoursRemaining - 24) / 48) * 12);
    } else if (hoursRemaining <= 168) {
      // Due within 7 days: 11 to 21 points
      urgencyScore = Math.round(21 - ((hoursRemaining - 72) / 96) * 10);
    } else {
      // Beyond 7 days: 3 to 11 points
      urgencyScore = Math.max(
        3,
        Math.round(11 - ((hoursRemaining - 168) / 168) * 8)
      );
    }
  }

  // 3. Importance Factor (Max 30)
  const rawImportance = parseInt(assignment.importance, 10) || 3;
  const clampedImportance = Math.min(5, Math.max(1, rawImportance));
  const importanceScore = clampedImportance * 6; // 1->6, 2->12, 3->18, 4->24, 5->30

  // 4. Remaining Effort Factor (Max 15)
  const remainingMinutes =
    typeof assignment.remainingMinutes === 'number'
      ? assignment.remainingMinutes
      : assignment.estimatedMinutes || 60;

  let effortScore = 0;
  if (remainingMinutes > 0) {
    // 300 minutes (5 hours) reaches max effort weight of 15
    effortScore = Math.min(15, Math.max(1, Math.round((remainingMinutes / 300) * 15)));
  }

  // 5. Total Combined Score (Clamped to 0–100)
  const totalScore = Math.min(
    100,
    Math.max(0, urgencyScore + importanceScore + effortScore + overduePenalty)
  );

  // 6. Natural Language Explanation Summary
  let summary = '';
  if (isOverdue) {
    const overdueHours = Math.abs(Math.floor(hoursRemaining));
    summary = `OVERDUE by ${overdueHours}h (${urgencyScore + overduePenalty} pts). Importance: ${clampedImportance}/5 (${importanceScore} pts), Effort: ${remainingMinutes}m (${effortScore} pts).`;
  } else if (hoursRemaining <= 24) {
    summary = `Critical: Due in ${Math.max(1, Math.round(hoursRemaining))}h (${urgencyScore} pts). Importance: ${clampedImportance}/5 (${importanceScore} pts), Effort: ${remainingMinutes}m (${effortScore} pts).`;
  } else if (hoursRemaining <= 72) {
    summary = `Upcoming: Due in ${Math.round(hoursRemaining / 24)} days (${urgencyScore} pts). Importance: ${clampedImportance}/5 (${importanceScore} pts), Effort: ${remainingMinutes}m (${effortScore} pts).`;
  } else {
    summary = `Scheduled: Due in ${Math.round(hoursRemaining / 24)} days (${urgencyScore} pts). Importance: ${clampedImportance}/5 (${importanceScore} pts), Effort: ${remainingMinutes}m (${effortScore} pts).`;
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
