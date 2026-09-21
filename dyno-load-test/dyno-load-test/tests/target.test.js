const request = require('supertest');
const createTargetApp = require('../src/target/app');

const app = createTargetApp();

describe('target API', () => {
  it('GET /target/ping responds immediately', async () => {
    const res = await request(app).get('/target/ping');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pong: true });
  });

  it('GET /target/lookup responds with simulated latency', async () => {
    const start = Date.now();
    const res = await request(app).get('/target/lookup');
    const elapsed = Date.now() - start;
    expect(res.status).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(10);
  });

  it('GET /target/compute computes a real fibonacci value', async () => {
    const res = await request(app).get('/target/compute?n=10');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ n: 10, result: 55 });
  });

  it('GET /target/compute clamps n to a safe range', async () => {
    const res = await request(app).get('/target/compute?n=9999');
    expect(res.status).toBe(200);
    expect(res.body.n).toBeLessThanOrEqual(35);
  });

  it('POST /target/orders requires item and qty', async () => {
    const res = await request(app).post('/target/orders').send({});
    expect(res.status).toBe(400);
  });

  it('POST /target/orders accepts a valid order', async () => {
    const res = await request(app).post('/target/orders').send({ item: 'Widget', qty: 2 });
    expect([201, 500]).toContain(res.status); // ~5% simulated failure rate
  });

  it('returns a JSON 404 for an unknown route', async () => {
    const res = await request(app).get('/target/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBeDefined();
  });
});
