const ApiError = require('./ApiError');

function validateField(field, rules, value) {
  const errors = [];
  const isEmpty = value === undefined || value === null || value === '';

  if (isEmpty) {
    if (rules.required) errors.push({ field, message: `${field} is required` });
    return errors;
  }

  if (rules.type === 'string' && typeof value !== 'string') {
    errors.push({ field, message: `${field} must be a string` });
    return errors;
  }

  if (rules.type === 'url') {
    if (typeof value !== 'string' || !/^https?:\/\/.+/i.test(value)) {
      errors.push({ field, message: `${field} must be a full http(s) URL` });
    }
    return errors;
  }

  if (rules.type === 'array') {
    if (!Array.isArray(value) || value.length === 0) {
      errors.push({ field, message: `${field} must be a non-empty array` });
      return errors;
    }
    if (rules.itemsIn) {
      const bad = value.filter((v) => !rules.itemsIn.includes(v));
      if (bad.length > 0) {
        errors.push({
          field,
          message: `${field} contains unknown values: ${bad.join(', ')}`,
        });
      }
    }
  }

  if (rules.type === 'enum' && !rules.enumValues.includes(value)) {
    errors.push({ field, message: `${field} must be one of: ${rules.enumValues.join(', ')}` });
  }

  if (rules.min !== undefined && typeof value === 'string' && value.trim().length < rules.min) {
    errors.push({ field, message: `${field} must be at least ${rules.min} characters` });
  }

  return errors;
}

function validate(schema, data) {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw ApiError.badRequest('Request body must be a JSON object');
  }
  const errors = Object.entries(schema).flatMap(([field, rules]) =>
    validateField(field, rules, data[field])
  );
  if (errors.length > 0) {
    throw ApiError.badRequest('Validation failed', errors);
  }
}

module.exports = { validate };
