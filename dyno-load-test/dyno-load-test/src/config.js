module.exports = {
  controlPort: process.env.CONTROL_PORT || 5000,
  targetPort: process.env.TARGET_PORT || 5001,
  targetBaseUrl: process.env.TARGET_BASE_URL || `http://localhost:${process.env.TARGET_PORT || 5001}`,

  limits: {
    minConcurrency: 1,
    maxConcurrency: 300,
    minDurationSeconds: 3,
    maxDurationSeconds: 120,
    maxRampUpSeconds: 60,
  },

  tickIntervalMs: 300,

  targets: {
    ping: { method: 'GET', path: '/target/ping', label: 'Ping (trivial)' },
    lookup: { method: 'GET', path: '/target/lookup', label: 'Lookup (simulated DB, 15-60ms)' },
    compute: { method: 'GET', path: '/target/compute', label: 'Compute (CPU-bound fibonacci)' },
    orders: { method: 'POST', path: '/target/orders', label: 'Create order (write, ~5% error rate)' },
  },
};
