const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Assignment = require('../src/models/assignment.model');
const StudyPlan = require('../src/models/studyPlan.model');

jest.mock('../src/models/user.model');
jest.mock('../src/models/assignment.model');
jest.mock('../src/models/studyPlan.model');

describe('Analytics API — /api/analytics', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const otherUserId = '507f1f77bcf86cd799439099';

  const mockUser = {
    _id: mockUserId,
    id: mockUserId,
    name: 'Sarah Connor',
    email: 'sarah@university.edu',
    toJSON() {
      return { id: this.id, name: this.name, email: this.email };
    },
  };

  const secret = process.env.JWT_SECRET || 'coursepilot_jwt_default_secret_key_32chars';
  const validToken = jwt.sign({ id: mockUserId }, secret, { expiresIn: '1h' });

  beforeEach(() => {
    jest.clearAllMocks();
    User.findById.mockImplementation((id) => ({
      select: jest.fn().mockImplementation((fields) => {
        if (id && id.toString() === mockUserId) {
          return Promise.resolve(mockUser);
        }
        return Promise.resolve(null);
      }),
    }));
  });

  describe('GET /api/analytics', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/analytics');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return accurate productivity metrics for authenticated user', async () => {
      const now = new Date('2026-10-27T12:00:00Z');
      const mockAssignments = [
        {
          _id: 'a1',
          user: mockUserId,
          title: 'Compiler Lab 1',
          subject: 'CS410',
          status: 'completed',
          estimatedMinutes: 90,
          remainingMinutes: 0,
          importance: 4,
          updatedAt: new Date('2026-10-26T10:00:00Z'),
        },
        {
          _id: 'a2',
          user: mockUserId,
          title: 'Machine Learning Project',
          subject: 'CS450',
          status: 'pending',
          estimatedMinutes: 180,
          remainingMinutes: 120,
          importance: 5,
          dueDate: new Date('2026-10-28T12:00:00Z'), // 24h away
        },
        {
          _id: 'a3',
          user: mockUserId,
          title: 'Algorithms Homework',
          subject: 'CS410',
          status: 'pending',
          estimatedMinutes: 60,
          remainingMinutes: 60,
          importance: 3,
          dueDate: new Date('2026-10-25T12:00:00Z'), // Overdue
        },
      ];

      // Assignment query mock
      Assignment.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockAssignments),
      });

      // Study plan mock
      StudyPlan.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue({
            _id: 'plan-1',
            totalStudyMinutesScheduled: 180,
            settings: { dailyCapacityMinutes: 120 },
            sessions: [{ durationMinutes: 60 }, { durationMinutes: 60 }, { durationMinutes: 60 }],
            unscheduled: [],
            warnings: [],
            days: [
              { dateString: '2026-10-27', usedMinutes: 120, capacityMinutes: 120, sessions: [{}, {}] },
              { dateString: '2026-10-28', usedMinutes: 60, capacityMinutes: 120, sessions: [{}] },
            ],
          }),
        }),
      });

      const res = await request(app)
        .get('/api/analytics')
        .set('Cookie', [`token=${validToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.analytics).toBeDefined();

      const { overview, workloadBySubject, priorityDistribution, planMetrics } =
        res.body.analytics;

      expect(overview.totalAssignments).toBe(3);
      expect(overview.completedAssignments).toBe(1);
      expect(overview.pendingAssignments).toBe(2);
      expect(overview.completionRate).toBe(33); // 1/3 = 33%
      expect(overview.overdueCount).toBe(1); // a3 is overdue
      expect(overview.totalEstimatedMinutes).toBe(330);
      expect(overview.totalRemainingMinutes).toBe(180);

      expect(workloadBySubject.length).toBe(2); // CS410 and CS450
      expect(priorityDistribution.length).toBe(3); // High, Medium, Low buckets
      expect(planMetrics.hasActivePlan).toBe(true);
      expect(planMetrics.totalScheduledMinutes).toBe(180);
    });

    it('should return empty/clean metrics when student has no coursework yet', async () => {
      Assignment.find.mockReturnValue({
        lean: jest.fn().mockResolvedValue([]),
      });
      StudyPlan.findOne.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(null),
        }),
      });

      const res = await request(app)
        .get('/api/analytics')
        .set('Cookie', [`token=${validToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.analytics.overview.totalAssignments).toBe(0);
      expect(res.body.analytics.overview.completionRate).toBe(0);
      expect(res.body.analytics.workloadBySubject).toEqual([]);
      expect(res.body.analytics.planMetrics.hasActivePlan).toBe(false);
    });
  });
});
