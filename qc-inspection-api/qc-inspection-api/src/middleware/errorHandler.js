/** Every route either throws/forwards an ApiError, or lets an unexpected
 * error bubble up. This is the one place that turns either into a
 * response, which is what keeps the JSON error shape identical no matter
 * which endpoint or failure mode produced it. */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // express.json() throws a plain SyntaxError (with a `status`/`type` set
  // by body-parser) when the request body isn't valid JSON at all.
  const isMalformedJson = err.type === 'entity.parse.failed' || (err instanceof SyntaxError && 'body' in err);

  let statusCode = err.statusCode || (isMalformedJson ? 400 : 500);
  let message = err.message;
  let details = err.details;

  if (isMalformedJson) {
    message = 'Request body is not valid JSON';
    details = undefined;
  }

  if (statusCode === 500) {
    // Never leak internal error text or stack traces to the client —
    // log the real thing server-side and send a generic message instead.
    // eslint-disable-next-line no-console
    console.error(err);
    message = 'Internal server error';
    details = undefined;
  }

  const body = { error: { message } };
  if (details) body.error.details = details;
  res.status(statusCode).json(body);
}

module.exports = errorHandler;
