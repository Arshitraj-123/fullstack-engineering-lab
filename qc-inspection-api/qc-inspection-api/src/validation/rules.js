const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Each checker returns null when the value passes, or a short message
 * describing the violated rule when it doesn't. Keeping them small and
 * pure makes the whole validation mechanism easy to unit test and to
 * extend with new rules later. */
const checkers = {
  string(value) {
    return typeof value === 'string' ? null : 'must be a string';
  },
  number(value) {
    return typeof value === 'number' && !Number.isNaN(value) ? null : 'must be a number';
  },
  integer(value) {
    return Number.isInteger(value) ? null : 'must be a whole number';
  },
  email(value) {
    return typeof value === 'string' && EMAIL_RE.test(value) ? null : 'must be a valid email address';
  },
  min(value, bound) {
    const size = typeof value === 'string' ? value.trim().length : value;
    return size >= bound ? null : `must be at least ${bound}${typeof value === 'string' ? ' characters' : ''}`;
  },
  max(value, bound) {
    const size = typeof value === 'string' ? value.trim().length : value;
    return size <= bound ? null : `must be at most ${bound}${typeof value === 'string' ? ' characters' : ''}`;
  },
  pattern(value, regex, message) {
    return regex.test(value) ? null : message || 'has an invalid format';
  },
  enum(value, allowed) {
    return allowed.includes(value) ? null : `must be one of: ${allowed.join(', ')}`;
  },
};

module.exports = { checkers, EMAIL_RE };
