const crypto = require('crypto');

/** Signs the exact bytes being sent — the receiver must verify against
 * the exact bytes it received, not a re-serialized copy, or a byte-for-
 * byte-identical-looking payload can still fail verification. */
function sign(rawBody, secret) {
  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return `sha256=${digest}`;
}

/** Timing-safe comparison — a plain `===` on digests leaks timing
 * information an attacker could use to guess the correct signature one
 * byte at a time. */
function verify(rawBody, secret, signatureHeader) {
  if (!signatureHeader) return false;
  const expected = sign(rawBody, secret);
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

module.exports = { sign, verify };
