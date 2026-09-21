const ApiError = require('../utils/ApiError');

/** Validates a book creation/update payload.
 * `partial` allows PATCH-style updates where not every field is present. */
function validateBookPayload(body, { partial = false } = {}) {
  const errors = [];
  const { title, author, isbn, publishedYear, available } = body;

  if (!partial || title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      errors.push('title is required and must be a non-empty string');
    }
  }

  if (!partial || author !== undefined) {
    if (typeof author !== 'string' || author.trim().length === 0) {
      errors.push('author is required and must be a non-empty string');
    }
  }

  if (!partial || isbn !== undefined) {
    if (typeof isbn !== 'string' || !/^\d{10}(\d{3})?$/.test(isbn)) {
      errors.push('isbn is required and must be a 10 or 13 digit string');
    }
  }

  if (!partial || publishedYear !== undefined) {
    const year = Number(publishedYear);
    if (!Number.isInteger(year) || year < 1450 || year > new Date().getFullYear()) {
      errors.push('publishedYear is required and must be a realistic year');
    }
  }

  if (available !== undefined && typeof available !== 'boolean') {
    errors.push('available must be a boolean when provided');
  }

  if (errors.length > 0) {
    throw ApiError.badRequest('Validation failed', errors);
  }
}

module.exports = { validateBookPayload };
