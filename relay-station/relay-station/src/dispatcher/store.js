const { randomUUID, randomBytes } = require('crypto');

let subscriptions = [];
let events = [];
let deliveries = [];

// --- Subscriptions ("relay lines") ---------------------------------

function generateSecret() {
  return randomBytes(16).toString('hex');
}

function createSubscription({ url, events: eventTypes, secret, label }) {
  const subscription = {
    id: randomUUID(),
    label: label || 'Untitled line',
    url,
    events: eventTypes,
    secret: secret || generateSecret(),
    active: true,
    createdAt: new Date().toISOString(),
  };
  subscriptions.push(subscription);
  return subscription;
}

function listSubscriptions() {
  return [...subscriptions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function findSubscription(id) {
  return subscriptions.find((s) => s.id === id);
}

function removeSubscription(id) {
  const index = subscriptions.findIndex((s) => s.id === id);
  if (index === -1) return false;
  subscriptions.splice(index, 1);
  return true;
}

function subscriptionsFor(eventType) {
  return subscriptions.filter(
    (s) => s.active && (s.events.includes('*') || s.events.includes(eventType))
  );
}

// --- Events -----------------------------------------------------------

function createEvent({ type, payload }) {
  const event = {
    id: randomUUID(),
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
  events.push(event);
  return event;
}

function listEvents() {
  return [...events].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 100);
}

// --- Deliveries ---------------------------------------------------------

function createDelivery({ eventId, subscriptionId }) {
  const delivery = {
    id: randomUUID(),
    eventId,
    subscriptionId,
    attempt: 0,
    status: 'pending', // pending | retrying | delivered | failed
    statusCode: null,
    error: null,
    nextAttemptAt: null,
    deliveredAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  deliveries.push(delivery);
  return delivery;
}

function updateDelivery(id, updates) {
  const delivery = deliveries.find((d) => d.id === id);
  if (!delivery) return null;
  Object.assign(delivery, updates, { updatedAt: new Date().toISOString() });
  return delivery;
}

function listDeliveries({ eventId } = {}) {
  let result = [...deliveries];
  if (eventId) result = result.filter((d) => d.eventId === eventId);
  return result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 200);
}

function reset() {
  subscriptions = [];
  events = [];
  deliveries = [];
}

module.exports = {
  createSubscription,
  listSubscriptions,
  findSubscription,
  removeSubscription,
  subscriptionsFor,
  createEvent,
  listEvents,
  createDelivery,
  updateDelivery,
  listDeliveries,
  reset,
};
