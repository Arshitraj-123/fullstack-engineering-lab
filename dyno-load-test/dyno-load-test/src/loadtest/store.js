const { randomUUID } = require('crypto');

let runs = [];
let activeRunId = null;

function createRun(config) {
  const run = {
    id: randomUUID(),
    config,
    status: 'running', // running | completed | aborted
    startedAt: new Date().toISOString(),
    finishedAt: null,
    summary: null,
  };
  runs.push(run);
  activeRunId = run.id;
  return run;
}

function completeRun(id, summary, status = 'completed') {
  const run = runs.find((r) => r.id === id);
  if (!run) return null;
  run.status = status;
  run.summary = summary;
  run.finishedAt = new Date().toISOString();
  if (activeRunId === id) activeRunId = null;
  return run;
}

function findRun(id) {
  return runs.find((r) => r.id === id);
}

function listRuns() {
  return [...runs].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt)).slice(0, 50);
}

function getActiveRunId() {
  return activeRunId;
}

function reset() {
  runs = [];
  activeRunId = null;
}

module.exports = { createRun, completeRun, findRun, listRuns, getActiveRunId, reset };
