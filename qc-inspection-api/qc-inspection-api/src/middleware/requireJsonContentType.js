const ApiError = require('../utils/ApiError');

/** POST/PUT/PATCH must declare Content-Type: application/json. Rejecting
 * anything else here, before body parsing even runs, gives a clear 415
 * instead of a confusing validation failure caused by an empty/garbled
 * body. */
function requireJsonContentType(req, res, next) {
  const methodsThatNeedABody = ['POST', 'PUT', 'PATCH'];
  if (!methodsThatNeedABody.includes(req.method)) {
    return next();
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) {
    return next(
      ApiError.unsupportedMediaType(
        `Content-Type must be application/json (got "${contentType || 'none'}")`
      )
    );
  }

  return next();
}

module.exports = requireJsonContentType;
