const request = require('supertest');
const app = require('../src/app');

describe('GET /api/health', () => {
  it('should return 200 OK with health status and accurate database connectivity', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('service', 'coursepilot-api');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('environment');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database).toHaveProperty('status');
    expect(res.body.database).toHaveProperty('ready');

    // Without an active MongoDB connection in test environment, readiness must be false
    expect(res.body.database.ready).toBe(false);
    expect(res.body.database.status).toBe('disconnected');
  });

  it('should return 404 for undefined API routes', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('success', false);
    expect(res.body.error).toHaveProperty('status', 404);
    expect(res.body.error.message).toMatch(/Resource not found/);
  });
});
