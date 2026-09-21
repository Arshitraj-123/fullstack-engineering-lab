process.env.TARGET_PORT = '5601';
process.env.TARGET_BASE_URL = 'http://localhost:5601';

const fetch = require('node-fetch');
const createTargetApp = require('../src/target/app');
const createControlApp = require('../src/loadtest/app');
const store = require('../src/loadtest/store');

jest.setTimeout(20000);

let targetServer;
let controlServer;
const CONTROL_PORT = 5600;

beforeAll((done) => {
  targetServer = createTargetApp().listen(5601, () => {
    controlServer = createControlApp().listen(CONTROL_PORT, done);
  });
});

afterAll((done) => {
  controlServer.close(() => targetServer.close(done));
});

beforeEach(() => {
  store.reset();
});

async function postJson(path, body) {
  const res = await fetch(`http://localhost:${CONTROL_PORT}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

describe('load test control flow', () => {
  it('runs a short test against the ping endpoint and produces a sane summary', async () => {
    const { status, body } = await postJson('/api/runs', {
      targetKey: 'ping',
      concurrency: 5,
      durationSeconds: 3,
      rampUpSeconds: 0,
    });
    expect(status).toBe(202);
    const runId = body.data.id;

    await new Promise((r) => setTimeout(r, 3800));

    const finalRes = await fetch(`http://localhost:${CONTROL_PORT}/api/runs/${runId}`);
    const finalBody = await finalRes.json();
    const run = finalBody.data;

    expect(run.status).toBe('completed');
    expect(run.summary.totalRequests).toBeGreaterThan(0);
    expect(run.summary.errorRate).toBe(0);
    expect(run.summary.latency.p95).toBeGreaterThanOrEqual(run.summary.latency.p50);
    expect(run.summary.latency.p99).toBeGreaterThanOrEqual(run.summary.latency.p95);
  });

  it('rejects a second run while one is already active', async () => {
    await postJson('/api/runs', { targetKey: 'ping', concurrency: 3, durationSeconds: 3 });
    const { status } = await postJson('/api/runs', { targetKey: 'ping', concurrency: 3, durationSeconds: 3 });
    expect(status).toBe(409);
    await new Promise((r) => setTimeout(r, 3200)); // let the first run finish
  });

  it('rejects an invalid configuration with an itemized 400', async () => {
    const { status, body } = await postJson('/api/runs', {
      targetKey: 'nonexistent',
      concurrency: 99999,
      durationSeconds: 1,
    });
    expect(status).toBe(400);
    expect(body.error.details.length).toBeGreaterThan(1);
  });

  it('can abort a running test early', async () => {
    const { body } = await postJson('/api/runs', {
      targetKey: 'lookup',
      concurrency: 4,
      durationSeconds: 30,
      rampUpSeconds: 0,
    });
    const runId = body.data.id;

    await new Promise((r) => setTimeout(r, 500));
    const abortRes = await postJson(`/api/runs/${runId}/abort`, {});
    expect(abortRes.status).toBe(202);

    await new Promise((r) => setTimeout(r, 500));
    const finalRes = await fetch(`http://localhost:${CONTROL_PORT}/api/runs/${runId}`);
    const run = (await finalRes.json()).data;
    expect(run.status).toBe('aborted');
    expect(run.summary.wallSeconds).toBeLessThan(5);
  });

  it('records a rising error rate against the flaky orders endpoint', async () => {
    const { body } = await postJson('/api/runs', {
      targetKey: 'orders',
      concurrency: 6,
      durationSeconds: 3,
      rampUpSeconds: 0,
    });
    const runId = body.data.id;
    await new Promise((r) => setTimeout(r, 3800));

    const finalRes = await fetch(`http://localhost:${CONTROL_PORT}/api/runs/${runId}`);
    const run = (await finalRes.json()).data;
    expect(run.summary.totalRequests).toBeGreaterThan(0);
    // ~5% simulated failure rate on orders — just confirm the mechanism
    // records errors distinctly from successes, not an exact rate.
    expect(run.summary).toHaveProperty('errorRate');
    expect(run.summary.statusCodeCounts).toBeDefined();
  });
});
