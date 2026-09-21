function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;
  const body = {
    error: {
      message: statusCode === 500 ? 'Internal server error' : err.message,
    },
  };

  if (err.details) {
    body.error.details = err.details;
  }

  if (statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json(body);
}

module.exports = errorHandler;
