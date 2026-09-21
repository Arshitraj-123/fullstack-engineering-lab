# Dyno Test Cell

A load testing tool built with **Node.js** and **Express** — configurable
concurrency and ramp-up, live percentile metrics pushed over
Server-Sent Events, and a small demo backend with endpoints of
deliberately different cost to load-test against. Styled as an engine
dynamometer test cell: gauges, a redline, a printed test strip.

## The two services

- **Target app** (`http://localhost:5001`) — the "system under test."
  Four endpoints with different performance characteristics:
  - `GET /target/ping` — trivial, near-zero cost.
  - `GET /target/lookup` — simulates a database call (15&ndash;60ms random delay).
  - `GET /target/compute` — a deliberately naive recursive Fibonacci
    (CPU-bound, blocks the event loop). Load-testing this one shows
    latency degrading for *every* concurrent request as load rises, not
    just the slow one — a real and common production failure mode.
  - `POST /target/orders` — a write endpoint with ~5% simulated failures,
    to exercise the error-rate gauge.
- **Control room** (`http://localhost:5000`) — configures and runs load
  tests against the target app, streams live metrics to the browser, and
  serves the UI.

## Why this design

- **Percentiles, not just averages.** An average latency hides the
  worst-affected requests. `src/loadtest/stats.js` computes p50/p95/p99
  from every recorded latency, both live (per-tick, in
  `src/loadtest/engine.js`) and in the final summary — because a backend
  that's "fine on average" but has a bad p99 is exactly the kind of
  problem load testing exists to catch.
- **Closed-loop load generation.** Each virtual user fires a request,
  waits for the response, and immediately fires the next — the same
  approach tools like ApacheBench and autocannon use. It's simple to
  reason about, at the cost of not modeling a fixed open-loop arrival
  rate; the README says so rather than pretending otherwise.
- **Ramp-up is real, not cosmetic.** Virtual users are started on a
  staggered schedule across the configured ramp-up window
  (`src/loadtest/engine.js`), so you can watch throughput climb instead
  of slamming the target with full concurrency in the first tick.
- **Live metrics over Server-Sent Events**, not polling — the same
  pattern used elsewhere in this series of projects for pushing updates
  from server to browser as they happen.
- **A known caveat, stated plainly:** the load generator and the target
  app share one machine (and here, one Node process on two ports), so
  the generator's own CPU/event-loop usage can influence what you
  measure — most obviously against the CPU-bound `/target/compute`
  endpoint. A rigorous load test runs the generator on separate hardware
  from the system under test. This project is built to teach the
  *mechanism and methodology* (concurrency, ramp-up, percentiles,
  thresholds) clearly, not to replace a production-grade tool like k6,
  Gatling, or Locust for real capacity planning.

## Run it

```bash
npm install
npm start
```

This starts **both** services in one process. Open
`http://localhost:5000` for the test cell.

For auto-restart on file changes:

```bash
npm run dev
```

## Run the tests

```bash
npm test
```

19 tests across three suites:
- `tests/stats.test.js` — percentile math (median, p95 on 100 sequential
  values, single-element and empty-array edge cases, non-mutation).
- `tests/target.test.js` — each target endpoint's behavior in isolation
  (simulated latency, Fibonacci correctness, input clamping, validation).
- `tests/integration.test.js` — spins up **both real servers** and runs
  actual load tests: a short run against `ping` produces a sane summary
  with `p50 <= p95 <= p99`; starting a second run while one is active is
  rejected with 409; an invalid configuration is rejected with an
  itemized 400; a running test can be aborted early and is marked
  accordingly; a run against the flaky `orders` endpoint records both
  successes and failures distinctly.

## Using the UI

- **Run setup:** pick a target, set load (virtual users), duration, and
  an optional ramp-up, then **START RUN**. **ABORT** stops it early.
- **Live gauges:** requests/sec, p95 latency, and error rate, each with a
  needle and a redline zone. The `IDLE` / `RUNNING` / `REDLINE` lamps
  reflect whether any gauge has crossed into its redline.
- **Trace:** a live scrolling chart of throughput and p95 latency for the
  current run.
- **Test strip:** a printed-looking summary once a run finishes — total
  requests, average RPS, error rate, and the full latency breakdown.
- **Run history:** every past run this session, with its headline
  numbers, so you can compare configurations.

Try this to see the mechanism clearly: run `compute` at low concurrency
(5) first, note the latency; then run it again at high concurrency (40+)
and watch the p95/p99 gauges climb into the redline as the single-
threaded event loop gets saturated — a genuine demonstration of what
load testing is for.

## Endpoints (control room, port 5000)

| Method | Path                  | Description                                    |
| ------ | --------------------- | ------------------------------------------------ |
| GET    | `/api/meta`             | Available targets, limits, currently active run id |
| POST   | `/api/runs`             | Start a new run                                       |
| POST   | `/api/runs/:id/abort`   | Abort the active run                                    |
| GET    | `/api/runs`             | Run history                                              |
| GET    | `/api/runs/:id`         | One run's config + summary                                |
| GET    | `/api/stream`           | Server-Sent Events: `run-started`, `tick`, `run-completed` |

## Project structure

```
server.js                     # boots both the target app and control room
src/config.js                 # ports, targets, limits, tick interval
src/utils/ApiError.js
src/utils/errorMiddleware.js
src/target/app.js             # the demo system under test
src/loadtest/stats.js         # percentile / summary math
src/loadtest/engine.js        # virtual users, ramp-up, ticking, summary
src/loadtest/store.js         # run history
src/loadtest/sse.js           # Server-Sent Events broadcaster
src/loadtest/routes.js        # control API
src/loadtest/app.js           # control app assembly (serves UI too)
public/index.html             # Dyno Test Cell UI
public/styles.css
public/app.js
tests/stats.test.js
tests/target.test.js
tests/integration.test.js
```
