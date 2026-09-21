# Relay Station

Two independent backend services communicating over **signed, retried
webhooks** — plus a live **Server-Sent Events** stream pushing updates to
the browser — with a telegraph relay-station themed control room UI.

## The two services

- **Dispatcher** (`http://localhost:4000`) — the event source. Businesses
  fire domain events into it (`order.created`, `order.shipped`, etc.); it
  fans each one out as a signed HTTP POST to every subscription
  ("relay line") registered for that event type, with retry and
  exponential backoff on failure. It also serves the control-room UI.
- **Receiver** (`http://localhost:4001`) — a standalone webhook consumer.
  It verifies every incoming signature, can be switched into
  `flaky` / `slow` / `offline` modes to demonstrate how the dispatcher's
  retry logic reacts to a real unreliable downstream service, and keeps
  an inbox log of everything it has seen (accepted or rejected).

They only ever talk to each other over real HTTP, on two different
ports — exactly like two separate backend services would in production.

## Why this design

- **HMAC-SHA256 over the raw bytes, not a re-serialized copy.**
  `src/utils/hmac.js` signs the exact string that goes out on the wire;
  the receiver verifies against the exact bytes it received
  (`express.json()`'s `verify` hook captures them). Re-serializing
  `JSON.parse`'d data before checking the signature is a common bug that
  silently breaks verification the moment key order or number formatting
  differs even slightly.
- **Timing-safe comparison.** `crypto.timingSafeEqual` instead of `===`
  avoids leaking how much of a forged signature happened to be correct.
- **Replay protection.** Every request also carries an
  `X-Relay-Timestamp` header; the receiver rejects anything older than 5
  minutes, even with a perfectly valid signature.
- **Retries with exponential backoff, not a fixed retry loop.**
  `src/dispatcher/deliveryWorker.js` waits 0.8s, then 1.5s, then 3s
  between attempts (4 attempts total) before giving up and marking a
  delivery permanently `failed`. A request that times out (the `slow`
  receiver mode) is treated as a failure too, via an `AbortController`.
- **Idempotency is visible, not assumed.** Because retries mean the same
  event can legitimately arrive at the receiver more than once, every
  delivery carries a stable `X-Relay-Delivery` id, and the receiver's
  inbox flags a repeat of that id as `DUPLICATE (retry)` rather than
  silently double-counting it — the exact problem a real consumer would
  need to guard against with idempotency keys.
- **The secret is looked up, not embedded in the URL.** The receiver
  doesn't get told the signing secret directly — it asks the dispatcher
  for it via `GET /api/internal/subscriptions/:id/secret`, identifying
  the subscription from an `X-Relay-Subscription` header. (In a real
  system this handshake would go through a secrets manager or a
  one-time registration step; it's simplified here for a local demo, and
  the code says so where it matters.)
- **The browser only ever talks to the dispatcher.** `/api/receiver/*`
  routes on the dispatcher proxy to the receiver server-side, so the UI
  needs no CORS configuration and stays a single page.
- **Two event-driven mechanisms, on purpose.** Webhooks (dispatcher ->
  receiver) are one style of event-based communication between services;
  Server-Sent Events (dispatcher -> browser, `GET /api/stream`) are
  another. The UI's relay log updates live via SSE with no polling.

## Run it

```bash
npm install
npm start
```

This starts **both** services in one process. Open
`http://localhost:4000` for the control room.

For auto-restart on file changes:

```bash
npm run dev
```

## Run the tests

```bash
npm test
```

15 tests across three suites:
- `tests/hmac.test.js` — signing/verification, including tamper and
  wrong-secret rejection.
- `tests/validate.test.js` — the small request validator.
- `tests/integration.test.js` — spins up **both real servers** on test
  ports and exercises the full loop: a subscribed event gets delivered
  and verified; an unsubscribed event type is not delivered; a forged
  signature is rejected with a 401; an offline receiver causes the
  dispatcher to retry on a backoff schedule and eventually mark the
  delivery `failed`; a duplicate delivery id is flagged in the inbox.

## Using the UI

- **Dispatch desk:** pick a signal type, edit the JSON payload, and
  "Send signal." Add relay lines (webhook subscriptions) with the event
  types each one cares about — the target URL defaults to the built-in
  receiver (`http://localhost:4001/webhook`) so there's nothing to
  configure to see it work end-to-end.
- **Receiving post:** the station-condition dial switches the receiver's
  simulated reliability. Set it to **Offline** or **Flaky line** *before*
  sending a signal to watch the relay log retry in real time; **Slow
  line** demonstrates a timeout-triggered retry even though the receiver
  eventually would have responded.
- **Relay log:** every delivery attempt, live, with a colored signal
  light (green = delivered, amber = retrying, red = failed) and the
  reason for any failure.

## Endpoints (dispatcher, port 4000)

| Method | Path                                   | Description                                    |
| ------ | --------------------------------------- | ------------------------------------------------ |
| GET    | `/api/meta`                               | Known event types                                  |
| GET/POST | `/api/subscriptions`                    | List / create relay lines                            |
| DELETE | `/api/subscriptions/:id`                  | Disconnect a relay line                                |
| GET/POST | `/api/events`                           | List / trigger domain events                             |
| GET    | `/api/deliveries?eventId=`                | List delivery attempts                                     |
| GET    | `/api/receiver/state`                     | Proxies the receiver's mode + inbox                          |
| POST   | `/api/receiver/mode`                      | Proxies a mode change to the receiver                          |
| GET    | `/api/stream`                             | Server-Sent Events stream of live updates                        |
| GET    | `/api/internal/subscriptions/:id/secret`  | Internal: lets the receiver fetch a signing secret                  |

## Endpoints (receiver, port 4001)

| Method | Path              | Description                                       |
| ------ | ------------------ | ---------------------------------------------------- |
| POST   | `/webhook`           | The actual webhook endpoint (signature-verified)        |
| GET    | `/status`            | Current simulated mode                                    |
| POST   | `/mode`              | Set mode: `reliable` / `flaky` / `slow` / `offline`          |
| GET    | `/inbox`             | Everything received so far, verified or not                    |

## Project structure

```
server.js                        # boots both services
src/config.js                    # ports, backoff schedule, event catalog
src/utils/ApiError.js
src/utils/errorMiddleware.js     # shared error handler + 404, both services
src/utils/hmac.js                # sign/verify
src/utils/validate.js            # small request validator
src/dispatcher/app.js
src/dispatcher/routes.js
src/dispatcher/store.js          # subscriptions, events, deliveries
src/dispatcher/deliveryWorker.js # signs, sends, retries with backoff
src/dispatcher/sse.js            # Server-Sent Events broadcaster
src/receiver/app.js              # webhook endpoint + mode + inbox
src/receiver/store.js
public/index.html                # Relay Station control room UI
public/styles.css
public/app.js
tests/hmac.test.js
tests/validate.test.js
tests/integration.test.js
```
