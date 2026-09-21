const config = require('../config');

/**
 * Tracks failed login attempts per email so a brute-force script can be
 * locked out for a cooldown window. This is intentionally simple
 * (in-memory, per-process) — a real deployment would back this with
 * Redis so it survives restarts and works across multiple instances.
 */

let attempts = new Map(); // email -> { count, firstAttemptAt }

function isLockedOut(email) {
  const record = attempts.get(email.toLowerCase());
  if (!record) return false;

  const windowExpired = Date.now() - record.firstAttemptAt > config.loginThrottle.windowMs;
  if (windowExpired) {
    attempts.delete(email.toLowerCase());
    return false;
  }

  return record.count >= config.loginThrottle.maxAttempts;
}

function recordFailure(email) {
  const key = email.toLowerCase();
  const record = attempts.get(key);
  if (!record || Date.now() - record.firstAttemptAt > config.loginThrottle.windowMs) {
    attempts.set(key, { count: 1, firstAttemptAt: Date.now() });
    return;
  }
  record.count += 1;
}

function clear(email) {
  attempts.delete(email.toLowerCase());
}

function reset() {
  attempts = new Map();
}

module.exports = { isLockedOut, recordFailure, clear, reset };
