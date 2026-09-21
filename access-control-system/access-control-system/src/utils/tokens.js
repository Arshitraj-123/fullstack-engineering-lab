const jwt = require('jsonwebtoken');
const config = require('../config');

function signAccessToken(user) {
  return jwt.sign({ role: user.role }, config.jwt.accessSecret, {
    subject: user.id,
    expiresIn: config.jwt.accessTtlSeconds,
  });
}

/** Returns the decoded payload, or throws if the token is missing/invalid/expired. */
function verifyAccessToken(token) {
  return jwt.verify(token, config.jwt.accessSecret);
}

module.exports = { signAccessToken, verifyAccessToken };
