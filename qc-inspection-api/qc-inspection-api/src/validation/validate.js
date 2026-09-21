const { checkers } = require('./rules');
const ApiError = require('../utils/ApiError');

/**
 * A field's schema looks like:
 *   { type: 'string', required: true, min: 2, max: 80 }
 *   { type: 'string', required: true, pattern: /^[A-Z]{3}-\d{4}$/, patternMessage: '...' }
 *   { type: 'number', required: true, min: 0.01 }
 *   { type: 'enum', required: true, enumValues: ['a', 'b'] }
 *
 * validate(schema, data, { partial }) throws a single ApiError(400) whose
 * `details` is an itemized array of every violation found — never just
 * the first one — so a caller can fix every field in one pass instead of
 * re-submitting repeatedly.
 */
function validateField(field, rules, value, partial) {
  const errors = [];
  const isEmpty = value === undefined || value === null || value === '';

  if (isEmpty) {
    if (rules.required && !partial) {
      errors.push({ field, rule: 'required', message: `${field} is required` });
    }
    return errors;
  }

  if (rules.type === 'enum') {
    const msg = checkers.enum(value, rules.enumValues);
    if (msg) errors.push({ field, rule: 'enum', message: `${field} ${msg}` });
    return errors;
  }

  if (rules.type && checkers[rules.type]) {
    const msg = checkers[rules.type](value);
    if (msg) {
      errors.push({ field, rule: rules.type, message: `${field} ${msg}` });
      return errors; // further checks (min/max/pattern) assume the right type
    }
  }

  if (rules.min !== undefined) {
    const msg = checkers.min(value, rules.min);
    if (msg) errors.push({ field, rule: 'min', message: `${field} ${msg}` });
  }

  if (rules.max !== undefined) {
    const msg = checkers.max(value, rules.max);
    if (msg) errors.push({ field, rule: 'max', message: `${field} ${msg}` });
  }

  if (rules.pattern) {
    const msg = checkers.pattern(value, rules.pattern, rules.patternMessage);
    if (msg) errors.push({ field, rule: 'pattern', message: `${field} ${msg}` });
  }

  return errors;
}

function validate(schema, data, { partial = false } = {}) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw ApiError.badRequest('Request body must be a JSON object', [
      { field: '(body)', rule: 'type', message: 'request body must be a JSON object' },
    ]);
  }

  const errors = Object.entries(schema).flatMap(([field, rules]) =>
    validateField(field, rules, data[field], partial)
  );

  if (errors.length > 0) {
    throw ApiError.badRequest('Validation failed', errors);
  }
}

module.exports = { validate };
