const fetch = require('node-fetch');
const config = require('../config');
const { sign } = require('../utils/hmac');
const store = require('./store');
const sse = require('./sse');

/** Fires one delivery attempt for `delivery`, and schedules a retry with
 * exponential backoff if it fails, up to config.maxAttempts total tries.
 * A delivery that eventually succeeds stops here; one that exhausts its
 * attempts is marked 'failed' (dead) and is not retried again. */
async function attemptDelivery(deliveryId) {
  const delivery = store.listDeliveries().find((d) => d.id === deliveryId);
  if (!delivery || delivery.status === 'delivered') return;

  const subscription = store.findSubscription(delivery.subscriptionId);
  const event = store.listEvents().find((e) => e.id === delivery.eventId);
  if (!subscription || !event) {
    store.updateDelivery(deliveryId, { status: 'failed', error: 'subscription or event no longer exists' });
    broadcastUpdate(deliveryId);
    return;
  }

  const attempt = delivery.attempt + 1;
  const rawBody = JSON.stringify({
    id: event.id,
    type: event.type,
    payload: event.payload,
    timestamp: event.createdAt,
  });
  const signature = sign(rawBody, subscription.secret);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.deliveryTimeoutMs);

  try {
    const res = await fetch(subscription.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Relay-Signature': signature,
        'X-Relay-Event': event.type,
        'X-Relay-Delivery': delivery.id,
        'X-Relay-Subscription': subscription.id,
        'X-Relay-Timestamp': String(Date.now()),
      },
      body: rawBody,
      signal: controller.signal,
    });

    if (res.ok) {
      store.updateDelivery(deliveryId, {
        attempt,
        status: 'delivered',
        statusCode: res.status,
        error: null,
        deliveredAt: new Date().toISOString(),
      });
      broadcastUpdate(deliveryId);
      return;
    }

    throw new Error(`Receiving station responded with HTTP ${res.status}`);
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    const message = isTimeout ? `Timed out after ${config.deliveryTimeoutMs}ms` : err.message;

    if (attempt >= config.maxAttempts) {
      store.updateDelivery(deliveryId, {
        attempt,
        status: 'failed',
        error: message,
        nextAttemptAt: null,
      });
      broadcastUpdate(deliveryId);
      return;
    }

    const delay = config.backoffMs[attempt - 1] || config.backoffMs[config.backoffMs.length - 1];
    store.updateDelivery(deliveryId, {
      attempt,
      status: 'retrying',
      error: message,
      nextAttemptAt: new Date(Date.now() + delay).toISOString(),
    });
    broadcastUpdate(deliveryId);
    setTimeout(() => attemptDelivery(deliveryId), delay);
  } finally {
    clearTimeout(timeout);
  }
}

function broadcastUpdate(deliveryId) {
  const delivery = store.listDeliveries().find((d) => d.id === deliveryId);
  if (delivery) sse.broadcast('delivery-update', delivery);
}

/** Called when a new event is created: fans it out to every active
 * subscription that cares about this event type. */
function dispatchEvent(event) {
  const matching = store.subscriptionsFor(event.type);
  return matching.map((subscription) => {
    const delivery = store.createDelivery({ eventId: event.id, subscriptionId: subscription.id });
    sse.broadcast('delivery-update', delivery);
    attemptDelivery(delivery.id);
    return delivery;
  });
}

module.exports = { dispatchEvent, attemptDelivery };
