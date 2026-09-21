const multer = require('multer');
const config = require('../config');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  let statusCode = err.statusCode || 500;
  let message = statusCode === 500 ? 'Internal server error' : err.message;
  let details = err.details;

  if (err instanceof multer.MulterError) {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      message = `File exceeds the ${Math.round(config.maxFileSizeBytes / (1024 * 1024))}MB limit`;
    } else if (err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = `Too many files in one request (max ${config.maxFilesPerRequest})`;
    } else {
      message = err.message;
    }
  }

  if (statusCode === 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  const body = { error: { message } };
  if (details) body.error.details = details;
  res.status(statusCode).json(body);
}

module.exports = errorHandler;
