const { validate } = require('../src/validation/validate');

const schema = {
  name: { type: 'string', required: true, min: 2, max: 10 },
  age: { type: 'integer', required: true, min: 0, max: 120 },
  role: { type: 'enum', required: true, enumValues: ['admin', 'user'] },
  email: { type: 'email', required: true },
};

function run(data, opts) {
  try {
    validate(schema, data, opts);
    return null;
  } catch (err) {
    return err;
  }
}

describe('validate()', () => {
  it('passes a fully valid payload', () => {
    const err = run({ name: 'Ada', age: 30, role: 'admin', email: 'a@b.com' });
    expect(err).toBeNull();
  });

  it('reports a missing required field', () => {
    const err = run({ age: 30, role: 'admin', email: 'a@b.com' });
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'name', rule: 'required' })])
    );
  });

  it('reports every violation at once, not just the first', () => {
    const err = run({ name: 'A', age: -5, role: 'root', email: 'not-an-email' });
    const fields = err.details.map((d) => d.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'age', 'role', 'email']));
    expect(err.details.length).toBeGreaterThanOrEqual(4);
  });

  it('enforces string min/max length', () => {
    const tooShort = run({ name: 'A', age: 1, role: 'user', email: 'a@b.com' });
    expect(tooShort.details.some((d) => d.field === 'name' && d.rule === 'min')).toBe(true);

    const tooLong = run({ name: 'A'.repeat(20), age: 1, role: 'user', email: 'a@b.com' });
    expect(tooLong.details.some((d) => d.field === 'name' && d.rule === 'max')).toBe(true);
  });

  it('enforces integer type distinctly from number', () => {
    const err = run({ name: 'Ada', age: 30.5, role: 'user', email: 'a@b.com' });
    expect(err.details.some((d) => d.field === 'age' && d.rule === 'integer')).toBe(true);
  });

  it('enforces enum membership', () => {
    const err = run({ name: 'Ada', age: 30, role: 'root', email: 'a@b.com' });
    expect(err.details[0]).toMatchObject({ field: 'role', rule: 'enum' });
  });

  it('enforces email format', () => {
    const err = run({ name: 'Ada', age: 30, role: 'user', email: 'nope' });
    expect(err.details[0]).toMatchObject({ field: 'email', rule: 'email' });
  });

  it('allows omitted fields in partial mode, but still validates ones that are present', () => {
    const err = run({ age: 200 }, { partial: true });
    expect(err.details).toEqual([{ field: 'age', rule: 'max', message: 'age must be at most 120' }]);
  });

  it('rejects a non-object body', () => {
    const err = run('just a string');
    expect(err.statusCode).toBe(400);
  });
});
