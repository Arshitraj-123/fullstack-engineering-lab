const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { verifyAccessToken } = require('../utils/tokens');
const usersStore = require('../data/usersStore');

/** Requires a valid `Authorization: Bearer <accessToken>` header.
 * On success, attaches req.user = { id, role }. */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(ApiError.unauthorized('Missing or malformed Authorization header'));
  }

  try {
    const payload = verifyAccessToken(token);
    const user = usersStore.findById(payload.sub);
    if (!user) {
      return next(ApiError.unauthorized('Token no longer matches a known account'));
    }
    req.user = { id: user.id, role: user.role };
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(ApiError.unauthorized('Access token expired'));
    }
    return next(ApiError.unauthorized('Invalid access token'));
  }
}

module.exports = authenticate;
