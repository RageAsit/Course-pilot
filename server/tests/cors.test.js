const request = require('supertest');
const app = require('../src/app');

describe('CORS Configuration & Production Preflight Handling', () => {
  const PROD_ORIGIN = 'https://course-pilot-six.vercel.app';
  const LOCAL_ORIGIN = 'http://localhost:5173';
  const UNAPPROVED_ORIGIN = 'https://malicious-site.example.com';

  const originalClientUrl = process.env.CLIENT_URL;
  const originalClientOrigin = process.env.CLIENT_ORIGIN;

  afterAll(() => {
    process.env.CLIENT_URL = originalClientUrl;
    process.env.CLIENT_ORIGIN = originalClientOrigin;
  });

  describe('Preflight OPTIONS Requests', () => {
    it('should successfully handle preflight OPTIONS for /api/auth/me from Vercel production origin', async () => {
      const res = await request(app)
        .options('/api/auth/me')
        .set('Origin', PROD_ORIGIN)
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'Content-Type, Authorization, Accept');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(PROD_ORIGIN);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-methods']).toMatch(/GET/);
      expect(res.headers['access-control-allow-methods']).toMatch(/POST/);
      expect(res.headers['access-control-allow-methods']).toMatch(/OPTIONS/);
      expect(res.headers['access-control-allow-headers']).toMatch(/Content-Type/i);
      expect(res.headers['access-control-allow-headers']).toMatch(/Authorization/i);
    });

    it('should successfully handle preflight OPTIONS for /api/auth/register from Vercel production origin', async () => {
      const res = await request(app)
        .options('/api/auth/register')
        .set('Origin', PROD_ORIGIN)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type, Accept');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(PROD_ORIGIN);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      expect(res.headers['access-control-allow-headers']).toMatch(/Content-Type/i);
    });

    it('should successfully handle preflight OPTIONS for /api/assignments from Vercel production origin', async () => {
      const res = await request(app)
        .options('/api/assignments')
        .set('Origin', PROD_ORIGIN)
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(PROD_ORIGIN);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should successfully handle preflight OPTIONS from local Vite origin', async () => {
      const res = await request(app)
        .options('/api/auth/me')
        .set('Origin', LOCAL_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe(LOCAL_ORIGIN);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });

  describe('Actual HTTP Requests with Origin Header', () => {
    it('should return CORS headers and credentials for GET /api/health from Vercel origin', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', PROD_ORIGIN);

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe(PROD_ORIGIN);
      expect(res.headers['access-control-allow-credentials']).toBe('true');
      // Must NOT return wildcard origin when credentials are true
      expect(res.headers['access-control-allow-origin']).not.toBe('*');
    });

    it('should allow requests with no Origin header (curl, server-to-server, postman)', async () => {
      const res = await request(app).get('/api/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('should NOT return access-control-allow-origin for unauthorized domains', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', UNAPPROVED_ORIGIN);

      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });

    it('should NOT allow preflight for unauthorized domains', async () => {
      const res = await request(app)
        .options('/api/auth/me')
        .set('Origin', UNAPPROVED_ORIGIN)
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  describe('Dynamic Environment Variable Support (CLIENT_URL)', () => {
    it('should dynamically allow origin set via CLIENT_URL with trailing slash', async () => {
      process.env.CLIENT_URL = 'https://custom-staging-deploy.vercel.app/';

      const res = await request(app)
        .options('/api/auth/me')
        .set('Origin', 'https://custom-staging-deploy.vercel.app')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('https://custom-staging-deploy.vercel.app');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('should support comma-separated origins in CLIENT_URL', async () => {
      process.env.CLIENT_URL = 'https://branch1.vercel.app, https://branch2.vercel.app';

      const res = await request(app)
        .options('/api/auth/me')
        .set('Origin', 'https://branch2.vercel.app')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.status).toBe(204);
      expect(res.headers['access-control-allow-origin']).toBe('https://branch2.vercel.app');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });
  });
});
