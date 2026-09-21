const { validate } = require('../src/utils/validate');

describe('validate()', () => {
  const schema = {
    url: { type: 'url', required: true },
    events: { type: 'array', required: true, itemsIn: ['a', 'b', 'c'] },
  };

  it('passes a valid payload', () => {
    expect(() => validate(schema, { url: 'http://x.com', events: ['a'] })).not.toThrow();
  });

  it('rejects a missing required field', () => {
    expect(() => validate(schema, { events: ['a'] })).toThrow(/Validation failed/);
  });

  it('rejects a non-URL string for a url field', () => {
    try {
      validate(schema, { url: 'not a url', events: ['a'] });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err.details.some((d) => d.field === 'url')).toBe(true);
    }
  });

  it('rejects an array item outside the allowed set', () => {
    try {
      validate(schema, { url: 'http://x.com', events: ['zzz'] });
      throw new Error('should have thrown');
    } catch (err) {
      expect(err.details.some((d) => d.field === 'events')).toBe(true);
    }
  });

  it('rejects a non-object body', () => {
    expect(() => validate(schema, 'nope')).toThrow();
  });
});
