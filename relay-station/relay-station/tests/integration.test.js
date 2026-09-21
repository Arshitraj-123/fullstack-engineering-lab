process.env.DISPATCHER_PORT = '4510';
process.env.RECEIVER_PORT = '4511';
process.env.DISPATCHER_BASE_URL = 'http://localhost:4510';
process.env.RECEIVER_BASE_URL = 'http://localhost:4511';

const fetch = require('node-fetch');
const createDispatcherApp = require('../src/dispatcher/app');
const createReceiverApp = require('../src/receiver/app');
const dispatcherStore = require('../src/dispatcher/store');
const receiverStore = require('../src/receiver/store');

jest.setTimeout(15000);

let dispatcherServer;
let receiverServer;

beforeAll((done) => {
  dispatcherServer = createDispatcherApp().listen(4510, () => {
    receiverServer = createReceiverApp().listen(4511, done);
  });
});

afterAll((done) => {
  receiverServer.close(() => dispatcherServer.close(done));
});

beforeEach(() => {
  dispatcherStore.reset();
  receiverStore.reset();
});

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

describe('end-to-end webhook delivery', () => {
  it('delivers a signed event to a subscribed, reliable receiver', async () => {
    await postJson('http://localhost:4510/api/subscriptions', {
      label: 'Test Line',
      url: 'http://localhost:4511/webhook',
      events: ['order.created'],
    });

    const { status } = await postJson('http://localhost:4510/api/events', {
      type: 'order.created',
      payload: { orderId: 'X1' },
    });
    expect(status).toBe(202);

    await new Promise((r) => setTimeout(r, 400));

    const deliveries = (await (await fetch('http://localhost:4510/api/deliveries')).json()).data;
    expect(deliveries[0].status).toBe('delivered');
    expect(deliveries[0].statusCode).toBe(200);

    const inbox = (await (await fetch('http://localhost:4511/inbox')).json()).data;
    expect(inbox[0].verified).toBe(true);
    expect(inbox[0].outcome).toBe('accepted');
  });

  it('does not queue a delivery for a subscription that is not subscribed to this event type', async () => {
    await postJson('http://localhost:4510/api/subscriptions', {
      label: 'Shipping only',
      url: 'http://localhost:4511/webhook',
      events: ['order.shipped'],
    });

    const { body } = await postJson('http://localhost:4510/api/events', {
      type: 'order.created',
      payload: {},
    });
    expect(body.data.queuedDeliveries).toBe(0);
  });

  it('rejects a forged signature at the receiver', async () => {
    const created = await postJson('http://localhost:4510/api/subscriptions', {
      label: 'Forgery test',
      url: 'http://localhost:4511/webhook',
      events: ['order.created'],
    });

    const res = await fetch('http://localhost:4511/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Relay-Subscription': created.body.data.id,
        'X-Relay-Signature': 'sha256=deadbeef',
        'X-Relay-Event': 'order.created',
        'X-Relay-Timestamp': String(Date.now()),
      },
      body: JSON.stringify({ id: 'fake', type: 'order.created', payload: {}, timestamp: new Date().toISOString() }),
    });
    expect(res.status).toBe(401);

    const inbox = (await (await fetch('http://localhost:4511/inbox')).json()).data;
    expect(inbox[0].verified).toBe(false);
    expect(inbox[0].outcome).toBe('rejected-signature');
  });

  it('retries against an offline receiver with backoff, then marks the delivery permanently failed', async () => {
    await postJson('http://localhost:4511/mode', { mode: 'offline' });

    await postJson('http://localhost:4510/api/subscriptions', {
      label: 'Offline test',
      url: 'http://localhost:4511/webhook',
      events: ['order.created'],
    });

    const { body } = await postJson('http://localhost:4510/api/events', {
      type: 'order.created',
      payload: {},
    });
    const eventId = body.data.event.id;

    // Backoff schedule totals 800 + 1500 + 3000 = 5300ms; give it margin.
    await new Promise((r) => setTimeout(r, 6500));

    const deliveries = (
      await (await fetch(`http://localhost:4510/api/deliveries?eventId=${eventId}`)).json()
    ).data;
    expect(deliveries[0].status).toBe('failed');
    expect(deliveries[0].attempt).toBe(4);

    await postJson('http://localhost:4511/mode', { mode: 'reliable' });
  });

  it('flags a re-delivered event as a duplicate in the receiver inbox', async () => {
    const created = await postJson('http://localhost:4510/api/subscriptions', {
      label: 'Dup test',
      url: 'http://localhost:4511/webhook',
      events: ['order.created'],
    });
    const secretRes = await fetch(
      `http://localhost:4510/api/internal/subscriptions/${created.body.data.id}/secret`
    );
    const { secret } = await secretRes.json();

    const { sign } = require('../src/utils/hmac');
    const rawBody = JSON.stringify({ id: 'evt-1', type: 'order.created', payload: {}, timestamp: new Date().toISOString() });
    const signature = sign(rawBody, secret);
    const headers = {
      'Content-Type': 'application/json',
      'X-Relay-Subscription': created.body.data.id,
      'X-Relay-Signature': signature,
      'X-Relay-Event': 'order.created',
      'X-Relay-Delivery': 'delivery-dup-1',
      'X-Relay-Timestamp': String(Date.now()),
    };

    await fetch('http://localhost:4511/webhook', { method: 'POST', headers, body: rawBody });
    const second = await fetch('http://localhost:4511/webhook', { method: 'POST', headers, body: rawBody });
    const secondBody = await second.json();
    expect(secondBody.duplicate).toBe(true);
  });
});
