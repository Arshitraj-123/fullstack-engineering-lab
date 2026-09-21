function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isMalformedJson = err.type === 'entity.parse.failed';
  const statusCode = err.statusCode || (isMalformedJson ? 400 : 500);
  let message = isMalformedJson ? 'Request body is not valid JSON' : err.message;

  if (statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
    message = 'Internal server error';
  }

  const body = { error: { message } };
  if (err.details) body.error.details = err.details;
  res.status(statusCode).json(body);
}

function notFound(req, res, next) {
  const ApiError = require('./ApiError');
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
}

module.exports = { errorHandler, notFound };
