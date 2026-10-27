const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Assignment = require('../src/models/assignment.model');
const StudyPlan = require('../src/models/studyPlan.model');
const { generateStudyPlan } = require('../src/services/studyPlanner.service');

jest.mock('../src/models/user.model');
jest.mock('../src/models/assignment.model');
jest.mock('../src/models/studyPlan.model');

describe('Automatic Study Planner', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockUser = {
    _id: mockUserId,
    id: mockUserId,
    name: 'Alex Rivera',
    email: 'alex@university.edu',
    toJSON() {
      return { id: this.id, name: this.name, email: this.email };
    },
  };

  const secret = process.env.JWT_SECRET || 'coursepilot_jwt_default_secret_key_32chars';
  let authCookie;

  beforeEach(() => {
    jest.clearAllMocks();
    const token = jwt.sign({ id: mockUserId }, secret, { expiresIn: '1h' });
    authCookie = `token=${token}`;

    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue(mockUser),
    });
  });

  describe('generateStudyPlan Algorithm Unit Tests', () => {
    const baseDate = new Date('2026-10-27T00:00:00.000Z');

    it('should respect daily capacity limits and not overload any day', () => {
      const dailyCapacity = 120; // 2 hours
      const assignments = [
        {
          id: 'task-1',
          title: 'Large Project',
          subject: 'CS301',
          dueDate: '2026-10-31T23:59:00Z',
          estimatedMinutes: 300,
          remainingMinutes: 300,
          importance: 4,
          status: 'pending',
        },
      ];

      const plan = generateStudyPlan(assignments, {
        startDate: baseDate,
        horizonDays: 5,
        dailyCapacityMinutes: dailyCapacity,
        preferredSessionMinutes: 60,
      });

      expect(plan.days.length).toBe(5);
      plan.days.forEach((day) => {
        expect(day.usedMinutes).toBeLessThanOrEqual(dailyCapacity);
        expect(day.availableMinutes).toBeGreaterThanOrEqual(0);
      });
      // 300 minutes should be distributed: Day 0 (120), Day 1 (120), Day 2 (60)
      expect(plan.totalStudyMinutesScheduled).toBe(300);
      expect(plan.unscheduled.length).toBe(0);
    });

    it('should split long assignments into sessions of preferred session length', () => {
      const assignments = [
        {
          id: 'task-long',
          title: 'Algorithms Revision',
          subject: 'CS200',
          dueDate: '2026-10-30T23:59:00Z',
          estimatedMinutes: 180,
          remainingMinutes: 180,
          importance: 3,
          status: 'pending',
        },
      ];

      const plan = generateStudyPlan(assignments, {
        startDate: baseDate,
        horizonDays: 4,
        dailyCapacityMinutes: 180,
        preferredSessionMinutes: 45, // Split into 45 min sessions
      });

      // 180 mins / 45 mins = 4 sessions
      expect(plan.sessions.length).toBe(4);
      plan.sessions.forEach((s) => {
        expect(s.durationMinutes).toBeLessThanOrEqual(45);
      });
      expect(plan.totalStudyMinutesScheduled).toBe(180);
    });

    it('should detect deadline conflicts and report unscheduled work', () => {
      // Task due tomorrow (Day 1) requiring 300 minutes, but capacity is only 100 mins/day
      // Max capacity before deadline is 200 mins (Day 0 + Day 1)
      const conflictingAssignments = [
        {
          id: 'task-conflict',
          title: 'Rush Paper',
          subject: 'ENG101',
          dueDate: '2026-10-28T23:59:00Z', // Due Day 1
          estimatedMinutes: 300,
          remainingMinutes: 300,
          importance: 5,
          status: 'pending',
        },
      ];

      const plan = generateStudyPlan(conflictingAssignments, {
        startDate: baseDate,
        horizonDays: 5,
        dailyCapacityMinutes: 100, // Only 200m capacity available before deadline
        preferredSessionMinutes: 50,
      });

      expect(plan.unscheduled.length).toBe(1);
      expect(plan.unscheduled[0].assignment).toBe('task-conflict');
      expect(plan.unscheduled[0].remainingMinutes).toBe(100); // 300 - 200 = 100 unscheduled
      expect(plan.warnings.length).toBeGreaterThan(0);
      expect(plan.warnings[0]).toMatch(/Capacity Conflict/i);
    });

    it('should explicitly flag overdue assignments and prioritize them for immediate completion', () => {
      const overdueAssignments = [
        {
          id: 'task-overdue',
          title: 'Overdue Homework',
          subject: 'PHYS101',
          dueDate: '2026-10-25T12:00:00Z', // Past date!
          estimatedMinutes: 90,
          remainingMinutes: 90,
          importance: 4,
          status: 'pending',
        },
      ];

      const plan = generateStudyPlan(overdueAssignments, {
        startDate: baseDate,
        horizonDays: 3,
        dailyCapacityMinutes: 180,
        preferredSessionMinutes: 45,
      });

      expect(plan.warnings.some((w) => w.includes('Overdue Notice'))).toBe(true);
      // Overdue task scheduled immediately on Day 0
      expect(plan.days[0].sessions.length).toBe(2); // 90m / 45m = 2 sessions
      expect(plan.days[0].usedMinutes).toBe(90);
    });

    it('should never schedule completed assignments', () => {
      const mixedAssignments = [
        {
          id: 'task-done',
          title: 'Finished Project',
          subject: 'CS100',
          dueDate: '2026-10-29T23:59:00Z',
          estimatedMinutes: 120,
          remainingMinutes: 0,
          status: 'completed',
        },
        {
          id: 'task-pending',
          title: 'Active Homework',
          subject: 'CS100',
          dueDate: '2026-10-29T23:59:00Z',
          estimatedMinutes: 60,
          remainingMinutes: 60,
          status: 'pending',
        },
      ];

      const plan = generateStudyPlan(mixedAssignments, {
        startDate: baseDate,
        horizonDays: 3,
      });

      expect(plan.sessions.some((s) => s.assignment === 'task-done')).toBe(false);
      expect(plan.sessions.some((s) => s.assignment === 'task-pending')).toBe(true);
      expect(plan.totalStudyMinutesScheduled).toBe(60);
    });

    it('should be deterministic for identical inputs', () => {
      const tasks = [
        { id: '1', title: 'Task A', subject: 'SUB1', dueDate: '2026-10-30T12:00Z', remainingMinutes: 120, importance: 4, status: 'pending' },
        { id: '2', title: 'Task B', subject: 'SUB2', dueDate: '2026-10-29T12:00Z', remainingMinutes: 90, importance: 5, status: 'pending' },
      ];

      const opts = { startDate: baseDate, horizonDays: 5, dailyCapacityMinutes: 120, preferredSessionMinutes: 45 };
      const run1 = generateStudyPlan(tasks, opts);
      const run2 = generateStudyPlan(tasks, opts);

      expect(run1.totalStudyMinutesScheduled).toBe(run2.totalStudyMinutesScheduled);
      expect(run1.sessions).toEqual(run2.sessions);
      expect(run1.warnings).toEqual(run2.warnings);
    });
  });

  describe('HTTP Endpoints (/api/planner)', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res1 = await request(app).get('/api/planner/priorities');
      const res2 = await request(app).post('/api/planner/generate').send({});
      const res3 = await request(app).get('/api/planner/current');

      expect(res1.status).toBe(401);
      expect(res2.status).toBe(401);
      expect(res3.status).toBe(401);
    });

    it('GET /api/planner/priorities should return prioritized assignments for authenticated user', async () => {
      const userAssignments = [
        {
          _id: 'assign-1',
          id: 'assign-1',
          user: mockUserId,
          title: 'Algorithms Pset',
          subject: 'CS301',
          dueDate: new Date('2026-10-29T23:59:00Z'),
          estimatedMinutes: 90,
          remainingMinutes: 90,
          importance: 5,
          status: 'pending',
          toJSON() {
            return { id: this.id, title: this.title, subject: this.subject, dueDate: this.dueDate.toISOString(), importance: this.importance, status: this.status, remainingMinutes: this.remainingMinutes };
          },
        },
      ];

      Assignment.find.mockResolvedValue(userAssignments);

      const res = await request(app)
        .get('/api/planner/priorities')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
      expect(res.body.priorities[0]).toHaveProperty('priorityScore');
      expect(res.body.priorities[0]).toHaveProperty('priorityBreakdown');
      expect(res.body.priorities[0]).toHaveProperty('prioritySummary');

      // Verify user scoping
      expect(Assignment.find).toHaveBeenCalledWith(
        expect.objectContaining({ user: mockUserId, status: 'pending' })
      );
    });

    it('POST /api/planner/generate should create and persist plan in MongoDB', async () => {
      const userAssignments = [
        {
          _id: 'assign-1',
          id: 'assign-1',
          user: mockUserId,
          title: 'Database Lab',
          subject: 'CS330',
          dueDate: new Date('2026-10-31T23:59:00Z'),
          estimatedMinutes: 120,
          remainingMinutes: 120,
          importance: 4,
          status: 'pending',
          toJSON() {
            return { id: this.id, title: this.title, subject: this.subject, dueDate: this.dueDate.toISOString(), importance: this.importance, status: this.status, remainingMinutes: this.remainingMinutes };
          },
        },
      ];

      Assignment.find.mockResolvedValue(userAssignments);

      const mockSavedPlan = {
        _id: 'plan-id-123',
        user: mockUserId,
        settings: {
          startDate: new Date('2026-10-27T00:00:00Z'),
          horizonDays: 7,
          dailyCapacityMinutes: 180,
          preferredSessionMinutes: 60,
        },
        totalStudyMinutesScheduled: 120,
        totalAssignmentsScheduled: 1,
        sessions: [
          {
            assignment: 'assign-1',
            title: 'Database Lab',
            subject: 'CS330',
            date: new Date('2026-10-27T00:00:00Z'),
            dateString: '2026-10-27',
            durationMinutes: 60,
            order: 1,
          },
        ],
        unscheduled: [],
        warnings: [],
        createdAt: new Date().toISOString(),
      };

      StudyPlan.create.mockResolvedValue(mockSavedPlan);

      const res = await request(app)
        .post('/api/planner/generate')
        .set('Cookie', [authCookie])
        .send({
          horizonDays: 7,
          dailyCapacityMinutes: 180,
          preferredSessionMinutes: 60,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.plan).toHaveProperty('id', 'plan-id-123');
      expect(res.body.plan).toHaveProperty('days');
      expect(res.body.plan).toHaveProperty('sessions');
      expect(StudyPlan.create).toHaveBeenCalled();
    });

    it('GET /api/planner/current should retrieve latest saved plan for user', async () => {
      const mockSavedPlan = {
        _id: 'plan-id-latest',
        user: mockUserId,
        settings: {
          startDate: new Date('2026-10-27T00:00:00Z'),
          horizonDays: 5,
          dailyCapacityMinutes: 120,
        },
        totalStudyMinutesScheduled: 90,
        totalAssignmentsScheduled: 1,
        sessions: [
          {
            assignment: 'assign-1',
            title: 'Math Set',
            subject: 'MATH',
            date: new Date('2026-10-27T00:00:00Z'),
            dateString: '2026-10-27',
            durationMinutes: 45,
            order: 1,
          },
        ],
        unscheduled: [],
        warnings: [],
        createdAt: new Date().toISOString(),
      };

      StudyPlan.findOne.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockSavedPlan),
      });

      const res = await request(app)
        .get('/api/planner/current')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.plan).toHaveProperty('id', 'plan-id-latest');
      expect(StudyPlan.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ user: mockUserId })
      );
    });
  });
});
