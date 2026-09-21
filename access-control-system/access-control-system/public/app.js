(() => {
  let accessToken = null; // kept in memory only — never localStorage

  const authView = document.getElementById('auth-view');
  const badgeView = document.getElementById('badge-view');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const authMessage = document.getElementById('auth-message');
  const tabs = document.querySelectorAll('.tab');
  const logoutBtn = document.getElementById('logout-btn');
  const rosterPanel = document.getElementById('roster-panel');
  const rosterBody = document.getElementById('roster-body');

  const badgeEl = document.getElementById('badge');
  const badgeBand = document.getElementById('badge-band');
  const badgePhoto = document.getElementById('badge-photo');
  const badgeName = document.getElementById('badge-name');
  const badgeId = document.getElementById('badge-id');
  const badgeEmail = document.getElementById('badge-email');
  const badgeIssued = document.getElementById('badge-issued');

  function initials(name) {
    return name
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  }

  function showMessage(text, kind) {
    authMessage.textContent = text;
    authMessage.className = `stamp-slot ${kind || ''}`;
  }

  function switchTab(name) {
    tabs.forEach((tab) => tab.classList.toggle('is-active', tab.dataset.tab === name));
    loginForm.classList.toggle('is-hidden', name !== 'login');
    registerForm.classList.toggle('is-hidden', name !== 'register');
    showMessage('', '');
  }

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });

  async function api(path, options = {}) {
    const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    const res = await fetch(path, {
      ...options,
      headers,
      credentials: 'include',
    });
    const body = res.status === 204 ? null : await res.json().catch(() => null);
    if (!res.ok) {
      const message = body && body.error ? body.error.message : `Request failed (${res.status})`;
      const error = new Error(message);
      error.status = res.status;
      error.details = body && body.error ? body.error.details : undefined;
      throw error;
    }
    return body;
  }

  function renderBadge(user) {
    const isAdmin = user.role === 'admin';
    badgeEl.classList.toggle('is-admin', isAdmin);
    badgeBand.textContent = isAdmin ? 'ADMINISTRATOR CLEARANCE' : 'STANDARD CLEARANCE';
    badgePhoto.textContent = initials(user.name);
    badgeName.textContent = user.name;
    badgeId.textContent = user.id.slice(0, 8).toUpperCase();
    badgeEmail.textContent = user.email;
    badgeIssued.textContent = formatDate(user.createdAt);
  }

  async function loadRosterIfAdmin(user) {
    if (user.role !== 'admin') {
      rosterPanel.classList.add('is-hidden');
      return;
    }
    try {
      const res = await api('/api/users');
      rosterBody.innerHTML = res.data
        .map(
          (u) => `
            <tr>
              <td>${escapeHtml(u.name)}</td>
              <td class="mono">${escapeHtml(u.email)}</td>
              <td class="clearance-${u.role}">${u.role}</td>
              <td class="mono">${formatDate(u.createdAt)}</td>
            </tr>`
        )
        .join('');
      rosterPanel.classList.remove('is-hidden');
    } catch (err) {
      rosterPanel.classList.add('is-hidden');
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]));
  }

  function showAuthedView(user) {
    authView.classList.add('is-hidden');
    badgeView.classList.remove('is-hidden');
    renderBadge(user);
    loadRosterIfAdmin(user);
  }

  function showAuthView() {
    badgeView.classList.add('is-hidden');
    authView.classList.remove('is-hidden');
  }

  async function handleAuthSuccess(data) {
    accessToken = data.accessToken;
    showAuthedView(data.user);
  }

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    showMessage('Scanning\u2026', '');
    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      });
      showMessage('ACCESS GRANTED', 'granted');
      await handleAuthSuccess(res.data);
    } catch (err) {
      showMessage(`ACCESS DENIED \u2014 ${err.message}`, 'denied');
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    showMessage('Processing request\u2026', '');
    try {
      const res = await api('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      });
      showMessage('BADGE ISSUED', 'granted');
      await handleAuthSuccess(res.data);
    } catch (err) {
      const details = err.details ? ` (${err.details.join('; ')})` : '';
      showMessage(`REQUEST DENIED \u2014 ${err.message}${details}`, 'denied');
    }
  });

  logoutBtn.addEventListener('click', async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      // ignore — we're logging out regardless
    }
    accessToken = null;
    loginForm.reset();
    registerForm.reset();
    switchTab('login');
    showAuthView();
  });

  // On load, try a silent refresh: if the httpOnly refresh cookie is
  // still valid, this re-establishes a session without asking the
  // person to sign in again.
  async function bootstrap() {
    try {
      const res = await api('/api/auth/refresh', { method: 'POST' });
      accessToken = res.data.accessToken;
      showAuthedView(res.data.user);
    } catch (err) {
      showAuthView();
    }
  }

  bootstrap();
})();
