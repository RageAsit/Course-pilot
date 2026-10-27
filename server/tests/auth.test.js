const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/user.model');

// Mock User model to isolate tests from modifying live database
jest.mock('../src/models/user.model');

describe('Auth API — /api/auth', () => {
  const mockUserId = '507f1f77bcf86cd799439011';
  const mockUserData = {
    _id: mockUserId,
    id: mockUserId,
    name: 'Alex Rivera',
    email: 'alex@university.edu',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    toJSON() {
      return {
        id: this.id,
        name: this.name,
        email: this.email,
        createdAt: this.createdAt,
      };
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student and set HttpOnly token cookie', async () => {
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue({
        ...mockUserData,
        _id: mockUserId,
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alex Rivera',
          email: 'alex@university.edu',
          password: 'securePassword123',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('id', mockUserId);
      expect(res.body.user).toHaveProperty('name', 'Alex Rivera');
      expect(res.body.user).toHaveProperty('email', 'alex@university.edu');
      expect(res.body.user).not.toHaveProperty('password');

      // Verify HttpOnly cookie was set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=/);
      expect(cookies[0]).toMatch(/HttpOnly/i);
    });

    it('should reject registration when email already exists (duplicate)', async () => {
      User.findOne.mockResolvedValue({ _id: mockUserId, email: 'alex@university.edu' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Alex Rivera',
          email: 'alex@university.edu',
          password: 'securePassword123',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/already exists/i);
    });

    it('should reject invalid registration payloads (short password, invalid email)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'not-an-email',
          password: '123',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toHaveProperty('details');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should successfully log in and issue HttpOnly cookie', async () => {
      const mockUserWithPassword = {
        ...mockUserData,
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex@university.edu',
          password: 'securePassword123',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('id', mockUserId);

      // Verify cookie
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toMatch(/token=/);
      expect(cookies[0]).toMatch(/HttpOnly/i);
    });

    it('should return 401 generic error for non-existent email', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'unknown@university.edu',
          password: 'somePassword123',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });

    it('should return 401 generic error for incorrect password', async () => {
      const mockUserWithWrongPassword = {
        ...mockUserData,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithWrongPassword),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'alex@university.edu',
          password: 'wrongPassword',
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/invalid email or password/i);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return user profile when valid session cookie is provided', async () => {
      const secret = process.env.JWT_SECRET || 'coursepilot_jwt_default_secret_key_32chars';
      const validToken = jwt.sign({ id: mockUserId }, secret, { expiresIn: '1h' });

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserData),
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${validToken}`]);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toHaveProperty('id', mockUserId);
      expect(res.body.user).toHaveProperty('email', 'alex@university.edu');
    });

    it('should return 401 when unauthenticated (no cookie/token)', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toMatch(/Authentication required/i);
    });

    it('should return 401 when session token is invalid or tampered', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', ['token=invalid_garbage_token']);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should clear the token cookie and return success', async () => {
      const res = await request(app).post('/api/auth/logout');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      // Token cookie cleared with past expiration
      expect(cookies[0]).toMatch(/token=;/);
    });
  });
});
