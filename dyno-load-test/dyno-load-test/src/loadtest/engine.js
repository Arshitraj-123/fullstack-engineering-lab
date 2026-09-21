const fetch = require('node-fetch');
const { summarize } = require('./stats');

function randomItem() {
  const items = ['Widget', 'Gadget', 'Sprocket', 'Bracket', 'Valve'];
  return items[Math.floor(Math.random() * items.length)];
}

function buildRequest(targetDef, baseUrl, computeN) {
  const url = new URL(targetDef.path, baseUrl);
  if (targetDef.path === '/target/compute' && computeN) {
    url.searchParams.set('n', String(computeN));
  }
  const init = { method: targetDef.method };
  if (targetDef.method === 'POST') {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify({ item: randomItem(), qty: 1 + Math.floor(Math.random() * 5) });
  }
  return { url: url.toString(), init };
}

/**
 * Runs a closed-loop load test: each virtual user fires a request, waits
 * for the response, and immediately fires the next one, until the test
 * duration elapses. This mirrors how tools like ApacheBench/autocannon
 * generate load and is simple to reason about, at the cost of not
 * modeling a fixed open-loop arrival rate — noted in the README.
 */
function startRun(config, targetDef, baseUrl, { onTick, onComplete }) {
  const { concurrency, durationSeconds, rampUpSeconds, tickIntervalMs, computeN } = config;

  const startTime = Date.now();
  const endTime = startTime + durationSeconds * 1000;
  let aborted = false;

  let totalRequests = 0;
  let totalErrors = 0;
  const allLatencies = [];
  let windowLatencies = [];
  const statusCodeCounts = {};
  let activeVUs = 0;

  function recordStatus(code) {
    statusCodeCounts[code] = (statusCodeCounts[code] || 0) + 1;
  }

  async function virtualUser(vuIndex) {
    if (rampUpSeconds > 0) {
      const startDelay = (vuIndex / concurrency) * rampUpSeconds * 1000;
      await new Promise((resolve) => setTimeout(resolve, startDelay));
    }
    if (aborted || Date.now() >= endTime) return;
    activeVUs += 1;

    while (!aborted && Date.now() < endTime) {
      const { url, init } = buildRequest(targetDef, baseUrl, computeN);
      const started = Date.now();
      try {
        const res = await fetch(url, init);
        const latency = Date.now() - started;
        totalRequests += 1;
        allLatencies.push(latency);
        windowLatencies.push(latency);
        recordStatus(res.status);
        if (res.status >= 400) totalErrors += 1;
      } catch (err) {
        const latency = Date.now() - started;
        totalRequests += 1;
        totalErrors += 1;
        allLatencies.push(latency);
        windowLatencies.push(latency);
        recordStatus('ERR');
      }
    }
    activeVUs -= 1;
  }

  const vuPromises = Array.from({ length: concurrency }, (_, i) => virtualUser(i));

  const interval = setInterval(() => {
    const windowStats = summarize(windowLatencies);
    const currentRps = windowLatencies.length / (tickIntervalMs / 1000);
    windowLatencies = [];

    onTick({
      elapsedMs: Date.now() - startTime,
      activeVUs,
      totalRequests,
      totalErrors,
      currentRps,
      windowLatency: windowStats,
      statusCodeCounts: { ...statusCodeCounts },
    });
  }, tickIntervalMs);

  Promise.all(vuPromises).then(() => {
    clearInterval(interval);
    const wallSeconds = (Date.now() - startTime) / 1000;
    const summary = {
      wallSeconds,
      totalRequests,
      totalErrors,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      avgRps: totalRequests / wallSeconds,
      latency: summarize(allLatencies),
      statusCodeCounts,
      aborted,
    };
    onComplete(summary);
  });

  return {
    abort: () => {
      aborted = true;
    },
  };
}

module.exports = { startRun, buildRequest };
