/** A rejection with an HTTP status code attached, so the error handler
 * knows what to send back without guessing. */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }

  static badRequest(message, details) {
    return new ApiError(400, message, details);
  }

  static notFound(message) {
    return new ApiError(404, message);
  }
}

module.exports = ApiError;
