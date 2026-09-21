const request = require('supertest');
const createApp = require('../src/app');
const usersStore = require('../src/data/usersStore');
const refreshTokenStore = require('../src/data/refreshTokenStore');
const loginAttemptStore = require('../src/data/loginAttemptStore');
const config = require('../src/config');

const app = createApp();

beforeEach(() => {
  usersStore.reset();
  refreshTokenStore.reset();
  loginAttemptStore.reset();
});

function extractCookie(res) {
  const raw = res.headers['set-cookie'];
  return raw ? raw.find((c) => c.startsWith(config.refreshCookie.name)) : undefined;
}

describe('POST /api/auth/register', () => {
  it('creates a new user with the "user" role and returns an access token', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.data.user.role).toBe('user');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(extractCookie(res)).toMatch(/HttpOnly/);
  });

  it('ignores a client-supplied role (no privilege escalation)', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Eve',
      email: 'eve@example.com',
      password: 'password123',
      role: 'admin',
    });
    expect(res.body.data.user.role).toBe('user');
  });

  it('rejects a weak password', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Ada',
      email: 'ada2@example.com',
      password: 'short',
    });
    expect(res.status).toBe(400);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('rejects a duplicate email', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Ada',
      email: 'dup@example.com',
      password: 'password123',
    });
    const res = await request(app).post('/api/auth/register').send({
      name: 'Someone Else',
      email: 'dup@example.com',
      password: 'password123',
    });
    expect(res.status).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in the seeded admin', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: config.seedAdmin.email,
      password: config.seedAdmin.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
  });

  it('rejects an incorrect password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: config.seedAdmin.email,
      password: 'wrong-password',
    });
    expect(res.status).toBe(401);
  });

  it('locks out after too many failed attempts', async () => {
    for (let i = 0; i < config.loginThrottle.maxAttempts; i += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: config.seedAdmin.email, password: 'wrong' });
    }
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: config.seedAdmin.email, password: config.seedAdmin.password });
    expect(res.status).toBe(429);
  });
});

describe('GET /api/auth/me', () => {
  it('rejects a request with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns the profile for a valid token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: config.seedAdmin.email, password: config.seedAdmin.password });
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(config.seedAdmin.email);
  });

  it('rejects a malformed token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', 'Bearer not-a-token');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/users (admin only)', () => {
  it('blocks a regular user with 403', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Regular User',
      email: 'regular@example.com',
      password: 'password123',
    });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'regular@example.com', password: 'password123' });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(res.status).toBe(403);
  });

  it('allows an admin to list users', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: config.seedAdmin.email, password: config.seedAdmin.password });

    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});

describe('POST /api/auth/refresh', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: config.seedAdmin.email, password: config.seedAdmin.password });
    const cookie = extractCookie(login);

    const res = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeDefined();

    // the old refresh token must no longer work (rotation)
    const reuse = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(reuse.status).toBe(401);
  });

  it('rejects a missing refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('revokes the refresh token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: config.seedAdmin.email, password: config.seedAdmin.password });
    const cookie = extractCookie(login);

    const logoutRes = await request(app).post('/api/auth/logout').set('Cookie', cookie);
    expect(logoutRes.status).toBe(204);

    const refreshRes = await request(app).post('/api/auth/refresh').set('Cookie', cookie);
    expect(refreshRes.status).toBe(401);
  });
});
