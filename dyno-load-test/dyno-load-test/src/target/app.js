const express = require('express');
const morgan = require('morgan');
const { errorHandler, notFound } = require('../utils/errorMiddleware');

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

// Deliberately naive recursive implementation — the point is that it's
// CPU-bound and blocks the event loop, exactly like a real inefficient
// endpoint would, so load testing it shows latency degrading for
// *everyone* as concurrency rises (not just the caller).
function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

function createTargetApp() {
  const app = express();

  app.use(morgan('dev'));
  app.use(express.json());

  app.get('/target/ping', (req, res) => {
    res.status(200).json({ pong: true });
  });

  app.get('/target/lookup', async (req, res) => {
    await delay(randomBetween(15, 60));
    res.status(200).json({ data: { id: Math.floor(Math.random() * 1000), name: 'Sample Record' } });
  });

  app.get('/target/compute', (req, res) => {
    const n = Math.min(35, Math.max(10, Number(req.query.n) || 28));
    const result = fibonacci(n);
    res.status(200).json({ n, result });
  });

  app.post('/target/orders', async (req, res) => {
    await delay(randomBetween(30, 100));
    const { item, qty } = req.body || {};
    if (!item || !qty) {
      return res.status(400).json({ error: { message: 'item and qty are required' } });
    }
    if (Math.random() < 0.05) {
      return res.status(500).json({ error: { message: 'Simulated downstream failure' } });
    }
    return res.status(201).json({ data: { item, qty, orderId: Math.floor(Math.random() * 1e6) } });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = createTargetApp;
