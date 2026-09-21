const crypto = require('crypto');
const config = require('../config');

/**
 * Refresh tokens are opaque random strings, not JWTs — that's deliberate.
 * A JWT refresh token can't be revoked before it expires; keeping the
 * token server-side (a bit like a session) means logout, rotation, and
 * "revoke all sessions" are all just map operations.
 */

let tokens = new Map(); // token -> { userId, expiresAt }

function issue(userId) {
  const token = crypto.randomBytes(40).toString('hex');
  tokens.set(token, { userId, expiresAt: Date.now() + config.jwt.refreshTtlMs });
  return token;
}

function verify(token) {
  const record = tokens.get(token);
  if (!record) return null;
  if (record.expiresAt < Date.now()) {
    tokens.delete(token);
    return null;
  }
  return record;
}

/** Rotation: the old token is consumed and a new one is issued for the
 * same user, so a stolen-and-reused old token is immediately invalid. */
function rotate(oldToken) {
  const record = verify(oldToken);
  if (!record) return null;
  tokens.delete(oldToken);
  return issue(record.userId);
}

function revoke(token) {
  tokens.delete(token);
}

function revokeAllForUser(userId) {
  for (const [token, record] of tokens.entries()) {
    if (record.userId === userId) tokens.delete(token);
  }
}

function reset() {
  tokens = new Map();
}

module.exports = { issue, verify, rotate, revoke, revokeAllForUser, reset };
