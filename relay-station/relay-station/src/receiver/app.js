const express = require('express');
const morgan = require('morgan');
const fetch = require('node-fetch');
const config = require('../config');
const { verify } = require('../utils/hmac');
const { errorHandler, notFound } = require('../utils/errorMiddleware');
const store = require('./store');

const VALID_MODES = ['reliable', 'flaky', 'slow', 'offline'];

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function createReceiverApp() {
  const app = express();

  app.use(morgan('dev'));
  app.use(
    express.json({
      verify: (req, res, buf) => {
        req.rawBody = buf.toString('utf8');
      },
    })
  );

  app.get('/status', (req, res) => {
    res.status(200).json({ mode: store.getMode() });
  });

  app.post('/mode', (req, res) => {
    const { mode } = req.body || {};
    if (!VALID_MODES.includes(mode)) {
      return res.status(400).json({ error: { message: `mode must be one of: ${VALID_MODES.join(', ')}` } });
    }
    store.setMode(mode);
    return res.status(200).json({ mode: store.getMode() });
  });

  app.get('/inbox', (req, res) => {
    res.status(200).json({ data: store.listInbox() });
  });

  app.post('/webhook', async (req, res) => {
    const subscriptionId = req.headers['x-relay-subscription'];
    const mode = store.getMode();
    const deliveryHeaderId = req.headers['x-relay-delivery'];
    const eventTypeHeader = req.headers['x-relay-event'] || 'unknown';

    const alreadySeen = store
      .listInbox()
      .some((entry) => entry.deliveryId === deliveryHeaderId && entry.outcome === 'accepted');

    if (mode === 'offline') {
      store.record({
        subscriptionId,
        eventType: eventTypeHeader,
        payload: null,
        verified: null,
        outcome: 'rejected-offline',
        deliveryId: deliveryHeaderId,
      });
      return res.status(503).json({ error: { message: 'Receiving station is offline' } });
    }

    if (mode === 'flaky' && Math.random() < 0.5) {
      store.record({
        subscriptionId,
        eventType: eventTypeHeader,
        payload: null,
        verified: null,
        outcome: 'rejected-flaky',
        deliveryId: deliveryHeaderId,
      });
      return res.status(500).json({ error: { message: 'Simulated flaky failure' } });
    }

    if (mode === 'slow') {
      await delay(config.deliveryTimeoutMs + 1200);
    }

    // Signature verification: look up the shared secret from the
    // dispatcher (a stand-in for a secrets manager / registration
    // handshake in a real system), then verify over the exact raw bytes.
    let secret;
    try {
      const secretRes = await fetch(
        `${config.dispatcherBaseUrl}/api/internal/subscriptions/${subscriptionId}/secret`
      );
      if (!secretRes.ok) throw new Error('subscription unknown to dispatcher');
      ({ secret } = await secretRes.json());
    } catch (err) {
      store.record({
        subscriptionId,
        eventType: eventTypeHeader,
        payload: req.body,
        verified: false,
        outcome: 'rejected-signature',
        deliveryId: deliveryHeaderId,
      });
      return res.status(401).json({ error: { message: 'Could not verify signature (unknown subscription)' } });
    }

    const signatureHeader = req.headers['x-relay-signature'];
    const timestampHeader = Number(req.headers['x-relay-timestamp'] || 0);
    const isSignatureValid = verify(req.rawBody, secret, signatureHeader);
    const isFresh = Math.abs(Date.now() - timestampHeader) <= config.signatureToleranceMs;

    if (!isSignatureValid) {
      store.record({
        subscriptionId,
        eventType: eventTypeHeader,
        payload: req.body,
        verified: false,
        outcome: 'rejected-signature',
        deliveryId: deliveryHeaderId,
      });
      return res.status(401).json({ error: { message: 'Signature verification failed' } });
    }

    if (!isFresh) {
      store.record({
        subscriptionId,
        eventType: eventTypeHeader,
        payload: req.body,
        verified: true,
        outcome: 'rejected-replay',
        deliveryId: deliveryHeaderId,
      });
      return res.status(408).json({ error: { message: 'Timestamp outside tolerance window' } });
    }

    store.record({
      subscriptionId,
      eventType: eventTypeHeader,
      payload: req.body,
      verified: true,
      outcome: 'accepted',
      deliveryId: deliveryHeaderId,
      isDuplicate: alreadySeen,
    });

    return res.status(200).json({ received: true, duplicate: alreadySeen });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createReceiverApp;
