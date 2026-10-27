const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Assignment = require('../src/models/assignment.model');

jest.mock('../src/models/user.model');
jest.mock('../src/models/assignment.model');

describe('Assignments API — /api/assignments', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const otherUserId = '507f1f77bcf86cd799439099';
  const mockAssignmentId = '609c1f77bcf86cd799439022';

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

  describe('Authentication Guard', () => {
    it('should reject unauthenticated requests with 401', async () => {
      const res = await request(app).get('/api/assignments');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/assignments', () => {
    it('should create an assignment with valid payload for authenticated student', async () => {
      const mockCreated = {
        _id: mockAssignmentId,
        id: mockAssignmentId,
        user: mockUserId,
        title: 'Distributed Systems Lab 2',
        subject: 'CS450',
        description: 'Implement Paxos consensus',
        dueDate: new Date('2026-11-01T23:59:00Z'),
        estimatedMinutes: 120,
        remainingMinutes: 120,
        importance: 4,
        status: 'pending',
        toJSON() {
          return {
            id: this.id,
            user: this.user,
            title: this.title,
            subject: this.subject,
            description: this.description,
            dueDate: this.dueDate.toISOString(),
            estimatedMinutes: this.estimatedMinutes,
            remainingMinutes: this.remainingMinutes,
            importance: this.importance,
            status: this.status,
          };
        },
      };

      Assignment.create.mockResolvedValue(mockCreated);

      const res = await request(app)
        .post('/api/assignments')
        .set('Cookie', [authCookie])
        .send({
          title: 'Distributed Systems Lab 2',
          subject: 'CS450',
          description: 'Implement Paxos consensus',
          dueDate: '2026-11-01T23:59:00.000Z',
          estimatedMinutes: 120,
          remainingMinutes: 120,
          importance: 4,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.assignment).toHaveProperty('id', mockAssignmentId);
      expect(res.body.assignment).toHaveProperty('title', 'Distributed Systems Lab 2');
    });

    it('should reject payload with missing title or invalid due date with 400', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Cookie', [authCookie])
        .send({
          title: '',
          subject: 'CS450',
          dueDate: 'not-a-valid-date',
          estimatedMinutes: 60,
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject payload when remainingMinutes > estimatedMinutes with 400', async () => {
      const res = await request(app)
        .post('/api/assignments')
        .set('Cookie', [authCookie])
        .send({
          title: 'Calculus Problem Set',
          subject: 'MATH201',
          dueDate: '2026-11-05T23:59:00.000Z',
          estimatedMinutes: 60,
          remainingMinutes: 90, // Exceeds estimated!
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/assignments', () => {
    it('should list only the current user’s assignments', async () => {
      const mockAssignmentsList = [
        {
          _id: mockAssignmentId,
          id: mockAssignmentId,
          user: mockUserId,
          title: 'Algorithms Homework 3',
          subject: 'CS301',
          dueDate: new Date(),
          estimatedMinutes: 90,
          remainingMinutes: 45,
          importance: 3,
          status: 'pending',
          toJSON() {
            return {
              id: this.id,
              user: this.user,
              title: this.title,
              subject: this.subject,
              status: this.status,
            };
          },
        },
      ];

      Assignment.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockAssignmentsList),
      });

      const res = await request(app)
        .get('/api/assignments')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.assignments)).toBe(true);
      expect(res.body.count).toBe(1);

      // Verify that Assignment.find was called with the user's ID
      expect(Assignment.find).toHaveBeenCalledWith(
        expect.objectContaining({ user: mockUserId })
      );
    });
  });

  describe('Ownership Isolation (GET, PATCH, DELETE)', () => {
    it('should return 404 when attempting to get another student’s assignment', async () => {
      // findOne returns null because query scopes to user: mockUserId
      Assignment.findOne.mockResolvedValue(null);

      const res = await request(app)
        .get(`/api/assignments/${mockAssignmentId}`)
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/not found/i);
    });

    it('should return 404 when attempting to update another student’s assignment', async () => {
      Assignment.findOne.mockResolvedValue(null);

      const res = await request(app)
        .patch(`/api/assignments/${mockAssignmentId}`)
        .set('Cookie', [authCookie])
        .send({ title: 'Hacked Title' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 404 when attempting to delete another student’s assignment', async () => {
      Assignment.findOneAndDelete.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/assignments/${mockAssignmentId}`)
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should reject malformed ObjectIds with 400', async () => {
      const res = await request(app)
        .get('/api/assignments/not-a-valid-id')
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/assignments/:id/complete and /reopen', () => {
    it('should mark assignment completed and zero remainingMinutes', async () => {
      const mockDoc = {
        _id: mockAssignmentId,
        id: mockAssignmentId,
        user: mockUserId,
        status: 'pending',
        remainingMinutes: 60,
        estimatedMinutes: 60,
        save: jest.fn().mockResolvedValue(true),
        toJSON() {
          return { id: this.id, status: this.status, remainingMinutes: this.remainingMinutes };
        },
      };

      Assignment.findOne.mockResolvedValue(mockDoc);

      const res = await request(app)
        .patch(`/api/assignments/${mockAssignmentId}/complete`)
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(mockDoc.status).toBe('completed');
      expect(mockDoc.remainingMinutes).toBe(0);
      expect(mockDoc.save).toHaveBeenCalled();
    });

    it('should reopen completed assignment and restore remainingMinutes', async () => {
      const mockDoc = {
        _id: mockAssignmentId,
        id: mockAssignmentId,
        user: mockUserId,
        status: 'completed',
        remainingMinutes: 0,
        estimatedMinutes: 90,
        save: jest.fn().mockResolvedValue(true),
        toJSON() {
          return { id: this.id, status: this.status, remainingMinutes: this.remainingMinutes };
        },
      };

      Assignment.findOne.mockResolvedValue(mockDoc);

      const res = await request(app)
        .patch(`/api/assignments/${mockAssignmentId}/reopen`)
        .set('Cookie', [authCookie]);

      expect(res.status).toBe(200);
      expect(mockDoc.status).toBe('pending');
      expect(mockDoc.remainingMinutes).toBe(90);
      expect(mockDoc.save).toHaveBeenCalled();
    });
  });
});
