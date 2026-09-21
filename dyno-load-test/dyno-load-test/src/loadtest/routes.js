const express = require('express');
const config = require('../config');
const ApiError = require('../utils/ApiError');
const store = require('./store');
const sse = require('./sse');
const { startRun } = require('./engine');

const router = express.Router();
let currentController = null;

function validateConfig(body) {
  const errors = [];
  const { targetKey, concurrency, durationSeconds, rampUpSeconds } = body;

  if (!config.targets[targetKey]) {
    errors.push(`targetKey must be one of: ${Object.keys(config.targets).join(', ')}`);
  }
  if (
    !Number.isInteger(concurrency) ||
    concurrency < config.limits.minConcurrency ||
    concurrency > config.limits.maxConcurrency
  ) {
    errors.push(`concurrency must be an integer between ${config.limits.minConcurrency} and ${config.limits.maxConcurrency}`);
  }
  if (
    !Number.isInteger(durationSeconds) ||
    durationSeconds < config.limits.minDurationSeconds ||
    durationSeconds > config.limits.maxDurationSeconds
  ) {
    errors.push(`durationSeconds must be an integer between ${config.limits.minDurationSeconds} and ${config.limits.maxDurationSeconds}`);
  }
  if (
    rampUpSeconds !== undefined &&
    (!Number.isInteger(rampUpSeconds) || rampUpSeconds < 0 || rampUpSeconds > config.limits.maxRampUpSeconds)
  ) {
    errors.push(`rampUpSeconds must be an integer between 0 and ${config.limits.maxRampUpSeconds}`);
  }

  if (errors.length > 0) throw ApiError.badRequest('Validation failed', errors);
}

router.get('/meta', (req, res) => {
  res.status(200).json({
    targets: config.targets,
    limits: config.limits,
    activeRunId: store.getActiveRunId(),
  });
});

router.post('/runs', (req, res) => {
  if (store.getActiveRunId()) {
    throw ApiError.conflict('A run is already in progress. Abort it before starting a new one.');
  }

  validateConfig(req.body);
  const { targetKey, concurrency, durationSeconds, rampUpSeconds = 0, computeN } = req.body;
  const targetDef = config.targets[targetKey];

  const run = store.createRun({ targetKey, concurrency, durationSeconds, rampUpSeconds, computeN });
  sse.broadcast('run-started', run);

  currentController = startRun(
    { concurrency, durationSeconds, rampUpSeconds, tickIntervalMs: config.tickIntervalMs, computeN },
    targetDef,
    config.targetBaseUrl,
    {
      onTick: (tick) => sse.broadcast('tick', { runId: run.id, ...tick }),
      onComplete: (summary) => {
        const finished = store.completeRun(run.id, summary, summary.aborted ? 'aborted' : 'completed');
        sse.broadcast('run-completed', finished);
        currentController = null;
      },
    }
  );

  res.status(202).json({ data: run });
});

router.post('/runs/:id/abort', (req, res) => {
  const run = store.findRun(req.params.id);
  if (!run) throw ApiError.notFound('Unknown run');
  if (run.status !== 'running' || !currentController) {
    throw ApiError.badRequest('This run is not currently active');
  }
  currentController.abort();
  res.status(202).json({ data: { aborting: true } });
});

router.get('/runs', (req, res) => {
  res.status(200).json({ data: store.listRuns() });
});

router.get('/runs/:id', (req, res) => {
  const run = store.findRun(req.params.id);
  if (!run) throw ApiError.notFound('Unknown run');
  res.status(200).json({ data: run });
});

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

module.exports = router;
