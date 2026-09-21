(() => {
  const eventForm = document.getElementById('event-form');
  const eventTypeSelect = document.getElementById('event-type');
  const eventPayload = document.getElementById('event-payload');
  const subscriptionForm = document.getElementById('subscription-form');
  const eventCheckboxes = document.getElementById('event-checkboxes');
  const subsList = document.getElementById('subscriptions-list');
  const modeDial = document.getElementById('mode-dial');
  const inboxList = document.getElementById('inbox-list');
  const logTicker = document.getElementById('log-ticker');
  const logSummary = document.getElementById('log-summary');

  let eventTypes = [];
  let subscriptions = [];
  let events = [];

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function timeAgo(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour12: false });
  }

  // --- Meta + subscriptions -------------------------------------------

  async function loadMeta() {
    const res = await fetch('/api/meta');
    const body = await res.json();
    eventTypes = body.eventTypes;

    eventTypeSelect.innerHTML = eventTypes.map((t) => `<option value="${t}">${t}</option>`).join('');
    eventCheckboxes.innerHTML = eventTypes
      .map(
        (t) => `<label><input type="checkbox" name="events" value="${t}" checked /> ${t}</label>`
      )
      .join('');
  }

  async function loadSubscriptions() {
    const res = await fetch('/api/subscriptions');
    const body = await res.json();
    subscriptions = body.data;
    renderSubscriptions();
  }

  function renderSubscriptions() {
    if (subscriptions.length === 0) {
      subsList.innerHTML = '<p class="empty-note">No relay lines connected yet.</p>';
      return;
    }
    subsList.innerHTML = subscriptions
      .map(
        (s) => `
        <div class="sub-card">
          <div class="sub-card-top">
            <span class="sub-card-label">${escapeHtml(s.label)}</span>
            <button type="button" class="sub-card-remove" data-id="${s.id}">disconnect</button>
          </div>
          <div class="sub-card-meta mono">${escapeHtml(s.url)}</div>
          <div class="sub-card-events">${s.events.map(escapeHtml).join(', ')}</div>
        </div>`
      )
      .join('');
  }

  subsList.addEventListener('click', async (event) => {
    const btn = event.target.closest('.sub-card-remove');
    if (!btn) return;
    await fetch(`/api/subscriptions/${btn.dataset.id}`, { method: 'DELETE' });
    loadSubscriptions();
  });

  subscriptionForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(subscriptionForm);
    const selectedEvents = formData.getAll('events');
    const payload = {
      label: formData.get('label') || 'Untitled line',
      url: formData.get('url'),
      events: selectedEvents,
    };
    const res = await fetch('/api/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      subscriptionForm.reset();
      loadSubscriptions();
    } else {
      const body = await res.json().catch(() => null);
      alert(`Could not connect line: ${(body && body.error && body.error.message) || res.status}`);
    }
  });

  // --- Sending a signal ------------------------------------------------

  eventForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    let payload;
    try {
      payload = JSON.parse(eventPayload.value || '{}');
    } catch (err) {
      alert('Payload must be valid JSON');
      return;
    }
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: eventTypeSelect.value, payload }),
    });
  });

  // --- Receiving post: mode dial + inbox --------------------------------

  modeDial.addEventListener('click', async (event) => {
    const btn = event.target.closest('.dial-option');
    if (!btn) return;
    await fetch('/api/receiver/mode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: btn.dataset.mode }),
    });
    refreshReceiverState();
  });

  function renderInbox(inbox) {
    if (!inbox || inbox.length === 0) {
      inboxList.innerHTML = '<p class="empty-note">No signals received yet.</p>';
      return;
    }
    inboxList.innerHTML = inbox
      .slice(0, 25)
      .map((entry) => {
        const accepted = entry.outcome === 'accepted';
        return `
        <div class="inbox-item ${accepted ? 'accepted' : 'rejected'}">
          <div class="inbox-top">
            <span class="seal ${accepted ? 'accepted' : 'rejected'}">${accepted ? 'AUTHENTIC' : 'REJECTED'}</span>
            <span class="inbox-meta mono">${timeAgo(entry.receivedAt)}</span>
          </div>
          <div class="mono">${escapeHtml(entry.eventType)}${entry.isDuplicate ? ' <span class="duplicate-tag">DUPLICATE (retry)</span>' : ''}</div>
          <div class="inbox-meta">${escapeHtml(entry.outcome)}</div>
        </div>`;
      })
      .join('');
  }

  async function refreshReceiverState() {
    try {
      const res = await fetch('/api/receiver/state');
      const body = await res.json();
      const state = body.data;
      modeDial.querySelectorAll('.dial-option').forEach((btn) => {
        btn.classList.toggle('is-active', btn.dataset.mode === state.mode);
      });
      renderInbox(state.inbox);
    } catch (err) {
      // receiver unreachable — leave last known state on screen
    }
  }

  // --- Relay log (deliveries) --------------------------------------------

  function labelFor(id, list, key) {
    const item = list.find((x) => x.id === id);
    return item ? item[key] : id.slice(0, 8);
  }

  function renderDelivery(delivery) {
    const existing = document.getElementById(`delivery-${delivery.id}`);
    const subLabel = labelFor(delivery.subscriptionId, subscriptions, 'label');
    const eventType = labelFor(delivery.eventId, events, 'type');

    const statusText = {
      pending: 'queued',
      retrying: `retrying (attempt ${delivery.attempt})`,
      delivered: `delivered (HTTP ${delivery.statusCode})`,
      failed: 'failed — undeliverable',
    }[delivery.status];

    const html = `
      <span class="signal-light status-${delivery.status}"></span>
      <span class="log-text">
        <strong>${escapeHtml(eventType)}</strong> &rarr; ${escapeHtml(subLabel)} &mdash; ${escapeHtml(statusText)}
        ${delivery.error ? `<span class="log-code">(${escapeHtml(delivery.error)})</span>` : ''}
      </span>
      <span class="log-code mono">${timeAgo(delivery.updatedAt || delivery.createdAt)}</span>
    `;

    if (existing) {
      existing.innerHTML = html;
    } else {
      const row = document.createElement('div');
      row.className = 'log-entry';
      row.id = `delivery-${delivery.id}`;
      row.innerHTML = html;
      logTicker.appendChild(row);
      const placeholder = logTicker.querySelector('.empty-note');
      if (placeholder) placeholder.remove();
    }

    logSummary.textContent = `${logTicker.querySelectorAll('.log-entry').length} deliveries`;
  }

  async function loadEventsAndDeliveries() {
    const [eventsRes, deliveriesRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/deliveries'),
    ]);
    events = (await eventsRes.json()).data;
    const deliveries = (await deliveriesRes.json()).data;
    logTicker.innerHTML = '';
    [...deliveries].reverse().forEach(renderDelivery);
    if (deliveries.length === 0) {
      logTicker.innerHTML = '<p class="empty-note">Delivery attempts will appear here as they happen.</p>';
    }
  }

  function connectStream() {
    const source = new EventSource('/api/stream');
    source.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);
      if (type === 'event-created') {
        events.unshift(payload);
      } else if (type === 'delivery-update') {
        renderDelivery(payload);
      }
    };
    source.onerror = () => {
      // EventSource auto-reconnects; nothing to do here.
    };
  }

  async function init() {
    await loadMeta();
    await loadSubscriptions();
    await loadEventsAndDeliveries();
    await refreshReceiverState();
    connectStream();
    setInterval(refreshReceiverState, 1500);
  }

  init();
})();
