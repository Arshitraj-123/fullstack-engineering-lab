const ApiError = require('./ApiError');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterPayload({ name, email, password }) {
  const errors = [];

  if (typeof name !== 'string' || name.trim().length < 2) {
    errors.push('name is required and must be at least 2 characters');
  }
  if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
    errors.push('email is required and must be a valid email address');
  }
  if (typeof password !== 'string' || password.length < 8) {
    errors.push('password is required and must be at least 8 characters');
  } else if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push('password must contain both letters and numbers');
  }

  if (errors.length > 0) {
    throw ApiError.badRequest('Validation failed', errors);
  }
}

function validateLoginPayload({ email, password }) {
  const errors = [];
  if (typeof email !== 'string' || email.trim().length === 0) {
    errors.push('email is required');
  }
  if (typeof password !== 'string' || password.length === 0) {
    errors.push('password is required');
  }
  if (errors.length > 0) {
    throw ApiError.badRequest('Validation failed', errors);
  }
}

module.exports = { validateRegisterPayload, validateLoginPayload };
