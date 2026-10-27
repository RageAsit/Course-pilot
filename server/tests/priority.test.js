const {
  calculatePriority,
  prioritizeAssignments,
} = require('../src/services/priority.service');

describe('Priority Engine Service', () => {
  const referenceDate = new Date('2026-10-27T12:00:00.000Z');

  describe('calculatePriority', () => {
    it('should assign score 0 to completed assignments', () => {
      const assignment = {
        title: 'Completed Physics Lab',
        status: 'completed',
        importance: 5,
        dueDate: '2026-10-28T12:00:00.000Z',
        remainingMinutes: 120,
      };

      const result = calculatePriority(assignment, referenceDate);
      expect(result.score).toBe(0);
      expect(result.breakdown.urgency).toBe(0);
      expect(result.breakdown.importance).toBe(0);
      expect(result.isOverdue).toBe(false);
    });

    it('should assign appropriately high priority to overdue assignments', () => {
      // Due 24 hours ago
      const overdueAssignment = {
        title: 'Overdue Essay',
        status: 'pending',
        importance: 4,
        dueDate: '2026-10-26T12:00:00.000Z', // 24h past
        remainingMinutes: 120,
      };

      const result = calculatePriority(overdueAssignment, referenceDate);
      expect(result.isOverdue).toBe(true);
      expect(result.breakdown.urgency).toBe(40); // Max urgency is 40
      expect(result.breakdown.overdue).toBeGreaterThanOrEqual(5); // Overdue penalty
      expect(result.score).toBe(
        result.breakdown.urgency +
          result.breakdown.importance +
          result.breakdown.effort +
          result.breakdown.overdue
      );
      expect(result.score).toBeGreaterThanOrEqual(70);
    });

    it('should maintain exact mathematical sum equality: score = urgency + importance + effort + overdue', () => {
      const task = {
        title: 'Midterm Prep',
        status: 'pending',
        importance: 5, // 30
        dueDate: '2026-10-28T00:00:00.000Z', // 12h away -> urgency in [30, 40]
        remainingMinutes: 180, // effort 12
      };

      const result = calculatePriority(task, referenceDate);
      const expectedSum =
        result.breakdown.urgency +
        result.breakdown.importance +
        result.breakdown.effort +
        result.breakdown.overdue;

      expect(result.score).toBe(expectedSum);
      expect(result.breakdown.urgency).toBeLessThanOrEqual(40);
      expect(result.breakdown.importance).toBeLessThanOrEqual(30);
      expect(result.breakdown.effort).toBeLessThanOrEqual(20);
      expect(result.breakdown.overdue).toBeLessThanOrEqual(10);
      expect(result.summary).toContain(`${result.score}/100 pts`);
    });

    it('should scale effort correctly and cap at 20 points for 300+ minutes', () => {
      const smallTask = calculatePriority(
        { status: 'pending', importance: 3, dueDate: '2026-10-30T12:00:00Z', remainingMinutes: 15 },
        referenceDate
      );
      const mediumTask = calculatePriority(
        { status: 'pending', importance: 3, dueDate: '2026-10-30T12:00:00Z', remainingMinutes: 150 },
        referenceDate
      );
      const maxTask = calculatePriority(
        { status: 'pending', importance: 3, dueDate: '2026-10-30T12:00:00Z', remainingMinutes: 300 },
        referenceDate
      );
      const overMaxTask = calculatePriority(
        { status: 'pending', importance: 3, dueDate: '2026-10-30T12:00:00Z', remainingMinutes: 900 },
        referenceDate
      );
      const zeroTask = calculatePriority(
        { status: 'pending', importance: 3, dueDate: '2026-10-30T12:00:00Z', remainingMinutes: 0 },
        referenceDate
      );

      expect(smallTask.breakdown.effort).toBe(1);
      expect(mediumTask.breakdown.effort).toBe(10);
      expect(maxTask.breakdown.effort).toBe(20);
      expect(overMaxTask.breakdown.effort).toBe(20); // capped at 20
      expect(zeroTask.breakdown.effort).toBe(0);
    });

    it('should rank urgent assignments higher than distant assignments', () => {
      const urgentAssignment = {
        title: 'Due in 6 hours',
        status: 'pending',
        importance: 3,
        dueDate: '2026-10-27T18:00:00.000Z', // 6h ahead
        remainingMinutes: 60,
      };

      const distantAssignment = {
        title: 'Due in 10 days',
        status: 'pending',
        importance: 3,
        dueDate: '2026-11-06T12:00:00.000Z', // 10 days ahead
        remainingMinutes: 60,
      };

      const urgentResult = calculatePriority(urgentAssignment, referenceDate);
      const distantResult = calculatePriority(distantAssignment, referenceDate);

      expect(urgentResult.score).toBeGreaterThan(distantResult.score);
      expect(urgentResult.breakdown.urgency).toBeGreaterThan(distantResult.breakdown.urgency);
    });

    it('should scale importance correctly from 1 to 5', () => {
      const lowImp = calculatePriority(
        { status: 'pending', importance: 1, dueDate: '2026-10-30T12:00:00.000Z', remainingMinutes: 60 },
        referenceDate
      );
      const highImp = calculatePriority(
        { status: 'pending', importance: 5, dueDate: '2026-10-30T12:00:00.000Z', remainingMinutes: 60 },
        referenceDate
      );

      expect(lowImp.breakdown.importance).toBe(6);
      expect(highImp.breakdown.importance).toBe(30);
      expect(highImp.score).toBeGreaterThan(lowImp.score);
    });

    it('should be deterministic for identical inputs', () => {
      const task = {
        id: '123',
        title: 'Deterministic Math Set',
        status: 'pending',
        importance: 4,
        dueDate: '2026-10-29T12:00:00.000Z',
        remainingMinutes: 180,
      };

      const run1 = calculatePriority(task, referenceDate);
      const run2 = calculatePriority(task, referenceDate);
      const run3 = calculatePriority(task, referenceDate);

      expect(run1.score).toBe(run2.score);
      expect(run2.score).toBe(run3.score);
      expect(run1.breakdown).toEqual(run2.breakdown);
      expect(run1.summary).toBe(run2.summary);
    });

    it('should keep scores clamped between 0 and 100', () => {
      const extremeTask = {
        status: 'pending',
        importance: 5,
        dueDate: '2026-10-01T12:00:00.000Z', // Long overdue
        remainingMinutes: 1000,
      };

      const result = calculatePriority(extremeTask, referenceDate);
      expect(result.score).toBeLessThanOrEqual(100);
      expect(result.score).toBeGreaterThanOrEqual(0);
    });

    it('should safely handle missing or invalid due dates', () => {
      const taskWithInvalidDate = {
        title: 'No due date',
        status: 'pending',
        importance: 3,
        dueDate: 'invalid-date-string',
        remainingMinutes: 60,
      };

      expect(() => calculatePriority(taskWithInvalidDate, referenceDate)).not.toThrow();
      const result = calculatePriority(taskWithInvalidDate, referenceDate);
      expect(result.score).toBeGreaterThan(0);
      expect(result.breakdown.urgency).toBe(10);
      expect(result.breakdown.hoursRemaining).toBeNull();
    });
  });

  describe('prioritizeAssignments', () => {
    it('should sort assignments with highest priority first and apply stable tie-breaking', () => {
      const tasks = [
        { id: 'task-low', title: 'Low priority', importance: 1, dueDate: '2026-11-15T12:00:00Z', remainingMinutes: 30, status: 'pending' },
        { id: 'task-overdue', title: 'Overdue task', importance: 4, dueDate: '2026-10-25T12:00:00Z', remainingMinutes: 90, status: 'pending' },
        { id: 'task-urgent', title: 'Due tomorrow', importance: 5, dueDate: '2026-10-28T12:00:00Z', remainingMinutes: 120, status: 'pending' },
      ];

      const ranked = prioritizeAssignments(tasks, referenceDate);

      expect(ranked[0].id).toBe('task-overdue');
      expect(ranked[1].id).toBe('task-urgent');
      expect(ranked[2].id).toBe('task-low');
      expect(ranked[0].priorityScore).toBeGreaterThanOrEqual(ranked[1].priorityScore);
      expect(ranked[1].priorityScore).toBeGreaterThan(ranked[2].priorityScore);
    });
  });
});
