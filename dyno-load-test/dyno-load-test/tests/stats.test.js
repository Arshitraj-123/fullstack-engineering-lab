const { percentile, summarize } = require('../src/loadtest/stats');

describe('percentile()', () => {
  it('returns 0 for an empty array', () => {
    expect(percentile([], 95)).toBe(0);
  });

  it('returns the exact value for a single-element array', () => {
    expect(percentile([42], 50)).toBe(42);
    expect(percentile([42], 99)).toBe(42);
  });

  it('computes p50 (median) correctly for a simple dataset', () => {
    expect(percentile([10, 20, 30, 40, 50], 50)).toBe(30);
  });

  it('computes p95 correctly for 100 sequential values', () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1); // 1..100
    expect(percentile(values, 95)).toBe(95);
  });

  it('does not mutate the input array', () => {
    const values = [5, 3, 1, 4, 2];
    percentile(values, 50);
    expect(values).toEqual([5, 3, 1, 4, 2]);
  });
});

describe('summarize()', () => {
  it('returns all zeros for an empty array', () => {
    expect(summarize([])).toEqual({ count: 0, min: 0, max: 0, avg: 0, p50: 0, p95: 0, p99: 0 });
  });

  it('computes min, max, avg, and count correctly', () => {
    const result = summarize([10, 20, 30]);
    expect(result.count).toBe(3);
    expect(result.min).toBe(10);
    expect(result.max).toBe(30);
    expect(result.avg).toBe(20);
  });
});
