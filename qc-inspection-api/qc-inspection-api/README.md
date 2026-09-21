# QC Inspection API

A product inventory API built with **Node.js** and **Express**, built
specifically to demonstrate a reusable **input validation mechanism** and
**centralized error handling** — with a Quality Control "Inspection
Station" themed UI to exercise every failure mode from a browser.

## Why this design

- **A schema-driven validator, not scattered if-statements.**
  `src/validation/rules.js` defines small, composable checkers (`string`,
  `number`, `integer`, `email`, `min`, `max`, `pattern`, `enum`).
  `src/validation/validate.js` reads a plain-object schema (see
  `src/schemas/product.schema.js`) and runs every field through the
  matching checkers, collecting **every** violation into one array
  instead of stopping at the first. A route just calls
  `validate(schema, req.body)` — the mechanism is entirely reusable for
  a second resource without copying any logic.
- **One error shape, no matter the failure mode.**
  `src/middleware/errorHandler.js` is the only place a response gets
  built for an error. It handles four distinct cases the same way:
  - an `ApiError` thrown deliberately (validation, not-found, conflict,
    unsupported media type) — the status and message it carries are used
    directly;
  - a malformed-JSON `SyntaxError` thrown by `express.json()` itself —
    translated into a clean 400 instead of Express's default HTML error
    page;
  - any other unexpected error — logged in full server-side, but the
    client only ever sees a generic "Internal server error" with a 500.
    **Nothing internal (message, stack trace) ever reaches the response.**
- **Content-Type is checked before the body is even parsed.**
  `src/middleware/requireJsonContentType.js` runs ahead of
  `express.json()` on write requests, so a request with the wrong
  Content-Type gets a clear 415 instead of a confusing parse failure.
- **Async errors are not a special case.** `src/utils/asyncHandler.js`
  wraps an async route handler so a rejected promise reaches the same
  error middleware as a synchronous `throw` — see
  `GET /api/_debug/async-boom`.
- **Two dedicated debug endpoints** (`/api/_debug/boom` and
  `/api/_debug/async-boom`) exist purely so the error-handling mechanism
  can be exercised on demand, including from the UI's "Test rig" panel.

## Run it

```bash
npm install
npm start
```

Open `http://localhost:3000` for the Inspection Station UI.

For auto-restart on file changes:

```bash
npm run dev
```

## Run the tests

```bash
npm test
```

26 tests across two suites:
- `tests/validate.test.js` — unit tests for the validation engine itself
  (required fields, type checks, min/max, pattern, enum, email, partial
  updates, non-object bodies, reporting *every* violation at once).
- `tests/products.test.js` — integration tests for the full API: create
  success, every validation failure category, duplicate-SKU 409, 404s,
  PUT/PATCH, delete, malformed JSON, wrong Content-Type, and both
  simulated-500 endpoints (asserting the real error message is never
  leaked to the client).

## The UI

- **New work order:** a form for the `Product` resource. Submit it as-is
  to see a successful "PASSED INSPECTION" stamp, or with bad data to see
  a "FAILED INSPECTION" stamp plus an itemized defect list (one line per
  violated rule, in plain language).
- **Test rig:** seven buttons that fire a specific known-bad request
  directly at the API — missing fields, bad formats, a duplicate SKU, an
  unknown id, the wrong Content-Type, malformed JSON, and a simulated
  server error — so every error-handling path can be exercised with one
  click and inspected in the report panel.
- **Inventory ledger:** every product currently on file, with a "Retire"
  (delete) button per row.

## Endpoints

| Method | Path                  | Description                                    |
| ------ | --------------------- | ------------------------------------------------ |
| GET    | `/api/products`         | List all products                                  |
| POST   | `/api/products`         | Create a product (full validation)                  |
| GET    | `/api/products/:id`      | Get one product (404 if missing)                     |
| PUT    | `/api/products/:id`      | Replace a product (full validation)                    |
| PATCH  | `/api/products/:id`      | Partially update a product (partial validation)         |
| DELETE | `/api/products/:id`      | Delete a product                                          |
| GET    | `/api/_debug/boom`       | Deliberately throws, to exercise 500 handling               |
| GET    | `/api/_debug/async-boom` | Deliberately rejects a promise, same purpose                 |
| GET    | `/api/health`            | Liveness check                                                 |

Successful responses are shaped as `{ "data": ... }` (list adds `count`).
Errors are always `{ "error": { "message": ..., "details"?: [...] } }`,
where `details` (when present) is an array of `{ field, rule, message }`.

### Product schema

| Field         | Rule                                                |
| ------------- | ---------------------------------------------------- |
| `name`          | string, 2&ndash;80 characters                          |
| `sku`            | string, pattern `ABC-1234` (3 letters, dash, 4 digits), unique |
| `price`          | number, 0.01&ndash;999999                                |
| `quantity`       | integer, 0&ndash;1,000,000                                 |
| `category`       | one of Electronics / Apparel / Grocery / Toys / Other       |
| `contactEmail`   | valid email address                                            |

### Example requests

```bash
# A valid product
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name":"Desk Lamp","sku":"ELE-5001","price":24.99,"quantity":50,"category":"Electronics","contactEmail":"ops@example.com"}'

# Missing/invalid fields -> 400 with an itemized details array
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" -d '{}'

# Wrong Content-Type -> 415
curl -X POST http://localhost:3000/api/products -H "Content-Type: text/plain" -d 'x'

# Malformed JSON -> 400, not a crash
curl -X POST http://localhost:3000/api/products \
  -H "Content-Type: application/json" -d '{ not json'

# Simulated failure -> 500 with a generic message, full detail logged server-side only
curl http://localhost:3000/api/_debug/boom
```

## Project structure

```
server.js
src/app.js                          # express app assembly (used by both server.js and tests)
src/routes/products.routes.js
src/routes/debug.routes.js          # /api/_debug/boom, /async-boom
src/controllers/products.controller.js
src/data/productsStore.js           # in-memory store, seeded with 2 products
src/validation/rules.js             # composable field checkers
src/validation/validate.js          # schema-driven validator
src/schemas/product.schema.js
src/middleware/requireJsonContentType.js
src/middleware/notFound.js
src/middleware/errorHandler.js      # the single place responses get built for errors
src/utils/ApiError.js
src/utils/asyncHandler.js
public/index.html                   # Inspection Station UI
public/styles.css
public/app.js
tests/validate.test.js
tests/products.test.js
```
