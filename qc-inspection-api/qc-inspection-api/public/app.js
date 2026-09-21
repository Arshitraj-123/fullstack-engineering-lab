(() => {
  const form = document.getElementById('product-form');
  const report = document.getElementById('report');
  const ledgerBody = document.getElementById('ledger-body');
  const ledgerSummary = document.getElementById('ledger-summary');
  const rigButtons = document.querySelectorAll('.btn-rig');

  function stampFor(status) {
    if (status >= 200 && status < 300) return { cls: 'pass', text: 'PASSED INSPECTION' };
    if (status === 404) return { cls: 'info', text: 'NOT ON FILE' };
    if (status === 409) return { cls: 'warn', text: 'DUPLICATE FLAGGED' };
    if (status === 415) return { cls: 'warn', text: 'WRONG FORMAT' };
    if (status === 400) return { cls: 'fail', text: 'FAILED INSPECTION' };
    if (status >= 500) return { cls: 'fail', text: 'INSPECTION HALTED' };
    return { cls: 'info', text: `STATUS ${status}` };
  }

  function renderReport(status, body) {
    const stamp = stampFor(status);
    const message = (body && body.error && body.error.message) || (body && 'Created successfully') || 'No response body';
    const details = body && body.error && body.error.details;

    let html = `
      <div class="report-stamp-row">
        <span class="report-stamp ${stamp.cls}">${stamp.text}</span>
        <span class="report-code">HTTP ${status}</span>
      </div>
      <p class="report-message">${escapeHtml(message)}</p>
    `;

    if (Array.isArray(details) && details.length > 0) {
      html += '<ul class="defect-list">';
      html += details
        .map((d) => `<li>${escapeHtml(d.field)} &mdash; ${escapeHtml(d.message)}</li>`)
        .join('');
      html += '</ul>';
    } else if (body && body.data) {
      html += `<p class="report-message mono">${escapeHtml(JSON.stringify(body.data))}</p>`;
    }

    report.innerHTML = html;
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  async function submitJson(path, method, payload) {
    const res = await fetch(path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json().catch(() => null);
    return { status: res.status, body };
  }

  function formatMoney(n) {
    return `$${Number(n).toFixed(2)}`;
  }

  async function refreshLedger() {
    const res = await fetch('/api/products');
    const body = await res.json();
    ledgerSummary.textContent = `${body.count} item${body.count === 1 ? '' : 's'}`;

    if (body.data.length === 0) {
      ledgerBody.innerHTML = '<tr class="ledger-empty"><td colspan="6">No products on file yet.</td></tr>';
      return;
    }

    ledgerBody.innerHTML = body.data
      .map(
        (p) => `
        <tr data-id="${p.id}">
          <td class="mono">${escapeHtml(p.sku)}</td>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.category)}</td>
          <td class="mono">${formatMoney(p.price)}</td>
          <td class="mono">${p.quantity}</td>
          <td><button type="button" class="btn-retire" data-id="${p.id}">Retire</button></td>
        </tr>`
      )
      .join('');
  }

  ledgerBody.addEventListener('click', async (event) => {
    const btn = event.target.closest('.btn-retire');
    if (!btn) return;
    const res = await fetch(`/api/products/${btn.dataset.id}`, { method: 'DELETE' });
    renderReport(res.status, res.status === 204 ? { data: 'Product retired' } : await res.json().catch(() => null));
    refreshLedger();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const payload = {
      name: formData.get('name'),
      sku: formData.get('sku'),
      price: formData.get('price'),
      quantity: formData.get('quantity'),
      category: formData.get('category'),
      contactEmail: formData.get('contactEmail'),
    };
    const { status, body } = await submitJson('/api/products', 'POST', payload);
    renderReport(status, body);
    if (status === 201) {
      form.reset();
      refreshLedger();
    }
  });

  const scenarios = {
    async 'missing-fields'() {
      return submitJson('/api/products', 'POST', {});
    },
    async 'bad-formats'() {
      return submitJson('/api/products', 'POST', {
        name: 'A',
        sku: 'not-a-sku',
        price: -10,
        quantity: 3.5,
        category: 'Vehicles',
        contactEmail: 'not-an-email',
      });
    },
    async 'duplicate-sku'() {
      return submitJson('/api/products', 'POST', {
        name: 'Duplicate Test Item',
        sku: 'ELE-1001',
        price: 9.99,
        quantity: 10,
        category: 'Electronics',
        contactEmail: 'ops@example.com',
      });
    },
    async 'not-found'() {
      const res = await fetch('/api/products/00000000-0000-0000-0000-000000000000');
      const body = await res.json().catch(() => null);
      return { status: res.status, body };
    },
    async 'wrong-content-type'() {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'name=Desk Lamp',
      });
      const body = await res.json().catch(() => null);
      return { status: res.status, body };
    },
    async 'malformed-json'() {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ this is not valid json',
      });
      const body = await res.json().catch(() => null);
      return { status: res.status, body };
    },
    async 'server-error'() {
      const res = await fetch('/api/_debug/boom');
      const body = await res.json().catch(() => null);
      return { status: res.status, body };
    },
  };

  rigButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const scenario = scenarios[btn.dataset.test];
      if (!scenario) return;
      report.innerHTML = '<p class="report-placeholder">Running test\u2026</p>';
      const { status, body } = await scenario();
      renderReport(status, body);
    });
  });

  refreshLedger();
})();
