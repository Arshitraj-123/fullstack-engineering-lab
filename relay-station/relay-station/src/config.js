module.exports = {
  dispatcherPort: process.env.DISPATCHER_PORT || 4000,
  receiverPort: process.env.RECEIVER_PORT || 4001,
  receiverBaseUrl: process.env.RECEIVER_BASE_URL || `http://localhost:${process.env.RECEIVER_PORT || 4001}`,
  dispatcherBaseUrl: process.env.DISPATCHER_BASE_URL || `http://localhost:${process.env.DISPATCHER_PORT || 4000}`,

  // Kept short so the retry/backoff mechanism is visible within a few
  // seconds in the demo UI, rather than making someone wait minutes.
  backoffMs: [800, 1500, 3000],
  maxAttempts: 4, // 1 initial try + 3 retries
  deliveryTimeoutMs: 2000,

  eventTypes: ['order.created', 'order.shipped', 'order.cancelled', 'payment.failed'],

  // A signed request older than this is rejected by the receiver, even
  // with a valid signature — basic replay protection.
  signatureToleranceMs: 5 * 60 * 1000,
};
