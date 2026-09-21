const express = require('express');
const fetch = require('node-fetch');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const { validate } = require('../utils/validate');
const store = require('./store');
const { dispatchEvent } = require('./deliveryWorker');
const sse = require('./sse');

const router = express.Router();

const subscriptionSchema = {
  label: { type: 'string' },
  url: { type: 'url', required: true },
  events: { type: 'array', required: true, itemsIn: [...config.eventTypes, '*'] },
};

const eventSchema = {
  type: { type: 'enum', required: true, enumValues: config.eventTypes },
  payload: {},
};

// --- Subscriptions ("relay lines") -------------------------------------

router.get('/subscriptions', (req, res) => {
  res.status(200).json({ data: store.listSubscriptions() });
});

router.post('/subscriptions', (req, res) => {
  validate(subscriptionSchema, req.body);
  const subscription = store.createSubscription(req.body);
  res.status(201).json({ data: subscription });
});

router.delete('/subscriptions/:id', (req, res) => {
  const removed = store.removeSubscription(req.params.id);
  if (!removed) throw ApiError.notFound(`No subscription found with id ${req.params.id}`);
  res.status(204).send();
});

// --- Internal: lets the receiver look up the secret for a subscription
// so it can verify a signature. In a real deployment this would go
// through a secrets manager or a registration handshake, not a plain
// lookup endpoint — this is simplified for the demo. ---------------------

router.get('/internal/subscriptions/:id/secret', (req, res) => {
  const subscription = store.findSubscription(req.params.id);
  if (!subscription) throw ApiError.notFound('Unknown subscription');
  res.status(200).json({ secret: subscription.secret });
});

// --- Events --------------------------------------------------------------

router.get('/events', (req, res) => {
  res.status(200).json({ data: store.listEvents() });
});

router.post('/events', (req, res) => {
  validate(eventSchema, req.body);
  const event = store.createEvent(req.body);
  sse.broadcast('event-created', event);
  const deliveries = dispatchEvent(event);
  res.status(202).json({ data: { event, queuedDeliveries: deliveries.length } });
});

// --- Deliveries ------------------------------------------------------------

router.get('/deliveries', (req, res) => {
  res.status(200).json({ data: store.listDeliveries({ eventId: req.query.eventId }) });
});

// --- Receiver proxy (so the browser only ever talks to the dispatcher) ----

router.get('/receiver/state', async (req, res) => {
  try {
    const [statusRes, inboxRes] = await Promise.all([
      fetch(`${config.receiverBaseUrl}/status`),
      fetch(`${config.receiverBaseUrl}/inbox`),
    ]);
    const status = await statusRes.json();
    const inbox = await inboxRes.json();
    res.status(200).json({ data: { ...status, inbox: inbox.data } });
  } catch (err) {
    res.status(502).json({ error: { message: 'Receiving station is unreachable' } });
  }
});

router.post('/receiver/mode', async (req, res) => {
  try {
    const upstream = await fetch(`${config.receiverBaseUrl}/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const body = await upstream.json();
    res.status(upstream.status).json(body);
  } catch (err) {
    res.status(502).json({ error: { message: 'Receiving station is unreachable' } });
  }
});

// --- Live stream -------------------------------------------------------------

router.get('/stream', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write('retry: 3000\n\n');
  sse.addClient(res);

  req.on('close', () => sse.removeClient(res));
});

router.get('/meta', (req, res) => {
  res.status(200).json({ eventTypes: config.eventTypes, receiverBaseUrl: config.receiverBaseUrl });
});

module.exports = router;
