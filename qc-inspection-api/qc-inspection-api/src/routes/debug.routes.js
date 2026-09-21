const express = require('express');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/** Deliberately throws a synchronous error, so a caller can confirm the
 * error handler catches it, logs it server-side, and returns a generic
 * 500 without leaking this message or a stack trace. */
router.get('/boom', () => {
  throw new Error('Simulated synchronous failure for testing purposes');
});

/** Same idea, but from a rejected promise — confirms asyncHandler's
 * job of forwarding async errors to the same error middleware. */
router.get(
  '/async-boom',
  asyncHandler(async () => {
    await Promise.reject(new Error('Simulated async failure for testing purposes'));
  })
);

module.exports = router;
