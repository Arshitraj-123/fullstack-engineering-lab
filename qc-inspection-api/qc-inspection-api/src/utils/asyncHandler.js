/** Express doesn't forward a rejected promise from an async handler to
 * next() automatically (unless you're on Express 5). Wrapping a handler
 * with this closes that gap without repeating try/catch everywhere. */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
