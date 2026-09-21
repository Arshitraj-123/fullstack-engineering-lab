(() => {
  const runForm = document.getElementById('run-form');
  const targetSelect = document.getElementById('target-select');
  const computeNRow = document.getElementById('compute-n-row');
  const startBtn = document.getElementById('start-btn');
  const abortBtn = document.getElementById('abort-btn');
  const formError = document.getElementById('form-error');
  const historyList = document.getElementById('history-list');
  const printoutBody = document.getElementById('printout-body');
  const trace = document.getElementById('trace');
  const traceCtx = trace.getContext('2d');

  const GAUGE_MAX = { rps: 1000, latency: 500, error: 100 };
  const REDLINE_FRACTION = { rps: 0.8, latency: 0.6, error: 0.1 };

  let activeRunId = null;
  let traceData = []; // { rps, latency }
  const TRACE_WINDOW = 60;

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  // --- Gauges -----------------------------------------------------------

  function setNeedle(id, value, max) {
    const el = document.getElementById(id);
    const percent = Math.max(0, Math.min(1, value / max));
    const deg = (percent - 0.5) * 180;
    el.style.transform = `rotate(${deg}deg)`;
  }

  function setupRedlines() {
    ['rps', 'latency', 'error'].forEach((key) => {
      const path = document.getElementById(`${key}-redline`);
      const totalLen = path.getTotalLength();
      const redStart = REDLINE_FRACTION[key];
      const redLen = totalLen * (1 - redStart);
      path.style.strokeDasharray = `${redLen} ${totalLen}`;
      path.style.strokeDashoffset = `${-(totalLen - redLen)}`;
    });
  }

  function updateGauges({ rps, latencyP95, errorPct }) {
    setNeedle('rps-needle', rps, GAUGE_MAX.rps);
    setNeedle('latency-needle', latencyP95, GAUGE_MAX.latency);
    setNeedle('error-needle', errorPct, GAUGE_MAX.error);

    document.getElementById('rps-value').textContent = Math.round(rps);
    document.getElementById('latency-value').textContent = Math.round(latencyP95);
    document.getElementById('error-value').textContent = `${errorPct.toFixed(1)}%`;

    const isRedline =
      rps / GAUGE_MAX.rps >= REDLINE_FRACTION.rps ||
      latencyP95 / GAUGE_MAX.latency >= REDLINE_FRACTION.latency ||
      errorPct / GAUGE_MAX.error >= REDLINE_FRACTION.error;

    setLamp(activeRunId ? (isRedline ? 'redline' : 'running') : 'idle');
  }

  function setLamp(state) {
    ['idle', 'running', 'redline'].forEach((s) => {
      document.getElementById(`lamp-${s}`).classList.toggle(`lit-${s}`, s === state);
    });
  }

  // --- Trace chart --------------------------------------------------------

  function drawTrace() {
    const w = trace.width;
    const h = trace.height;
    traceCtx.clearRect(0, 0, w, h);
    traceCtx.strokeStyle = '#2a2723';
    traceCtx.lineWidth = 1;
    for (let i = 1; i < 4; i += 1) {
      const y = (h / 4) * i;
      traceCtx.beginPath();
      traceCtx.moveTo(0, y);
      traceCtx.lineTo(w, y);
      traceCtx.stroke();
    }
    if (traceData.length < 2) return;

    const stepX = w / (TRACE_WINDOW - 1);
    const maxRps = Math.max(10, ...traceData.map((d) => d.rps));
    const maxLat = Math.max(10, ...traceData.map((d) => d.latency));

    function plot(key, max, color) {
      traceCtx.strokeStyle = color;
      traceCtx.lineWidth = 2;
      traceCtx.beginPath();
      traceData.forEach((point, i) => {
        const x = i * stepX;
        const y = h - (point[key] / max) * (h - 10) - 5;
        if (i === 0) traceCtx.moveTo(x, y);
        else traceCtx.lineTo(x, y);
      });
      traceCtx.stroke();
    }

    plot('rps', maxRps, '#e0682c');
    plot('latency', maxLat, '#6aa8d8');
  }

  // --- Meta + form ----------------------------------------------------------

  async function loadMeta() {
    const res = await fetch('/api/meta');
    const body = await res.json();
    targetSelect.innerHTML = Object.entries(body.targets)
      .map(([key, def]) => `<option value="${key}">${escapeHtml(def.label)}</option>`)
      .join('');
    toggleComputeField();
    if (body.activeRunId) {
      activeRunId = body.activeRunId;
      setRunningUI(true);
    }
  }

  function toggleComputeField() {
    computeNRow.classList.toggle('is-hidden', targetSelect.value !== 'compute');
  }

  targetSelect.addEventListener('change', toggleComputeField);

  function setRunningUI(isRunning) {
    startBtn.disabled = isRunning;
    abortBtn.disabled = !isRunning;
    setLamp(isRunning ? 'running' : 'idle');
  }

  runForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    formError.textContent = '';
    const formData = new FormData(runForm);
    const payload = {
      targetKey: formData.get('targetKey'),
      concurrency: Number(formData.get('concurrency')),
      durationSeconds: Number(formData.get('durationSeconds')),
      rampUpSeconds: Number(formData.get('rampUpSeconds')),
    };
    if (payload.targetKey === 'compute') {
      payload.computeN = Number(formData.get('computeN'));
    }

    traceData = [];
    printoutBody.innerHTML = '<p class="empty-note">Run in progress&hellip;</p>';

    const res = await fetch('/api/runs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = await res.json();
    if (!res.ok) {
      formError.textContent = (body.error && body.error.message) || 'Could not start run';
      if (body.error && body.error.details) {
        formError.textContent += ': ' + body.error.details.join('; ');
      }
      return;
    }
    activeRunId = body.data.id;
    setRunningUI(true);
  });

  abortBtn.addEventListener('click', async () => {
    if (!activeRunId) return;
    await fetch(`/api/runs/${activeRunId}/abort`, { method: 'POST' });
  });

  // --- History + printout ---------------------------------------------------

  function renderHistory(runs) {
    if (runs.length === 0) {
      historyList.innerHTML = '<p class="empty-note">No runs yet.</p>';
      return;
    }
    historyList.innerHTML = runs
      .map((run) => {
        const s = run.summary;
        const summaryText = s
          ? `${s.totalRequests} req &middot; ${s.avgRps.toFixed(0)} rps &middot; p95 ${s.latency.p95}ms &middot; ${(s.errorRate * 100).toFixed(1)}% err`
          : 'in progress';
        return `
        <div class="history-item ${run.status}">
          <div class="history-top">
            <span>${escapeHtml(run.config.targetKey)}</span>
            <span class="mono">${run.status}</span>
          </div>
          <div class="history-meta mono">${escapeHtml(summaryText)}</div>
        </div>`;
      })
      .join('');
  }

  function renderPrintout(run) {
    const s = run.summary;
    if (!s) return;
    printoutBody.innerHTML = `
      <div class="printout-grid">
        <div class="printout-stat"><div class="label">Target</div><div class="value">${escapeHtml(run.config.targetKey)}</div></div>
        <div class="printout-stat"><div class="label">Status</div><div class="value">${escapeHtml(run.status)}</div></div>
        <div class="printout-stat"><div class="label">Total Requests</div><div class="value">${s.totalRequests}</div></div>
        <div class="printout-stat"><div class="label">Avg RPS</div><div class="value">${s.avgRps.toFixed(1)}</div></div>
        <div class="printout-stat"><div class="label">Error Rate</div><div class="value">${(s.errorRate * 100).toFixed(1)}%</div></div>
        <div class="printout-stat"><div class="label">Latency Min</div><div class="value">${s.latency.min}ms</div></div>
        <div class="printout-stat"><div class="label">Latency Avg</div><div class="value">${s.latency.avg.toFixed(0)}ms</div></div>
        <div class="printout-stat"><div class="label">p50</div><div class="value">${s.latency.p50}ms</div></div>
        <div class="printout-stat"><div class="label">p95</div><div class="value">${s.latency.p95}ms</div></div>
        <div class="printout-stat"><div class="label">p99</div><div class="value">${s.latency.p99}ms</div></div>
        <div class="printout-stat"><div class="label">Latency Max</div><div class="value">${s.latency.max}ms</div></div>
        <div class="printout-stat"><div class="label">Wall Time</div><div class="value">${s.wallSeconds.toFixed(1)}s</div></div>
      </div>
    `;
  }

  async function refreshHistory() {
    const res = await fetch('/api/runs');
    const body = await res.json();
    renderHistory(body.data);
  }

  // --- Live stream ------------------------------------------------------------

  function connectStream() {
    const source = new EventSource('/api/stream');
    source.onmessage = (event) => {
      const { type, payload } = JSON.parse(event.data);

      if (type === 'tick' && payload.runId === activeRunId) {
        const rps = payload.currentRps || 0;
        const latencyP95 = payload.windowLatency.p95 || 0;
        const errorPct = payload.totalRequests > 0 ? (payload.totalErrors / payload.totalRequests) * 100 : 0;
        updateGauges({ rps, latencyP95, errorPct });

        traceData.push({ rps, latency: latencyP95 });
        if (traceData.length > TRACE_WINDOW) traceData.shift();
        drawTrace();
      }

      if (type === 'run-completed') {
        activeRunId = null;
        setRunningUI(false);
        updateGauges({ rps: 0, latencyP95: 0, errorPct: 0 });
        renderPrintout(payload);
        refreshHistory();
      }

      if (type === 'run-started') {
        refreshHistory();
      }
    };
  }

  async function init() {
    await loadMeta();
    await refreshHistory();
    setupRedlines();
    drawTrace();
    connectStream();
  }

  init();
})();
