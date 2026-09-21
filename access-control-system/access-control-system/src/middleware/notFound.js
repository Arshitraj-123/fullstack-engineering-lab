const ApiError = require('../utils/ApiError');

function notFound(req, res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
}

module.exports = notFound;
