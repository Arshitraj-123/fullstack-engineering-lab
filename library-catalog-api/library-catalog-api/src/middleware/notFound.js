const ApiError = require('../utils/ApiError');

/** Runs when no route matched the request — turns it into a proper 404
 * instead of Express's default HTML error page. */
function notFound(req, res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
