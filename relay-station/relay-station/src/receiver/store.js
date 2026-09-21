const { randomUUID } = require('crypto');

let mode = 'reliable'; // reliable | flaky | slow | offline
let inbox = [];

function getMode() {
  return mode;
}

function setMode(next) {
  mode = next;
  return mode;
}

function record({ subscriptionId, eventType, payload, verified, outcome, deliveryId, isDuplicate }) {
  const entry = {
    id: randomUUID(),
    subscriptionId,
    eventType,
    payload,
    verified,
    outcome, // 'accepted' | 'rejected-signature' | 'rejected-replay' | 'rejected-flaky' | 'rejected-offline'
    deliveryId: deliveryId || null,
    isDuplicate: Boolean(isDuplicate),
    receivedAt: new Date().toISOString(),
  };
  inbox.push(entry);
  return entry;
}

function listInbox() {
  return [...inbox].sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt)).slice(0, 100);
}

function reset() {
  mode = 'reliable';
  inbox = [];
}

module.exports = { getMode, setMode, record, listInbox, reset };
