# Library Catalog API

A small RESTful API for managing a library's book catalog, built with
**Node.js** and **Express**. Includes full CRUD on a `books` resource plus
two small workflow actions (`checkout` / `return`), input validation, a
centralized JSON error format, and a Jest + Supertest test suite.

## Why this design

- **`server.js` vs `src/app.js`** — the Express app is assembled in
  `src/app.js` and exported as a factory (`createApp()`), while `server.js`
  just imports it and calls `.listen()`. This means the test suite can spin
  up the app in-process (via Supertest) without binding a real port.
- **In-memory store, swappable later** — `src/data/booksStore.js` exposes
  plain functions (`findAll`, `findById`, `create`, `update`, `remove`). If
  you later swap this for a real database, the controllers don't change.
- **One error shape everywhere** — route handlers throw an `ApiError`
  (`src/utils/ApiError.js`) and let it bubble up; `src/middleware/errorHandler.js`
  is the only place that turns an error into a response. Express 4 catches
  synchronous throws in route handlers automatically, so no extra
  try/catch wrapper is needed here.
- **Validation lives on its own** — `src/utils/validateBookPayload.js` is
  reused for both `POST` (full payload required) and `PATCH` (partial
  payload allowed) via a `{ partial: true }` flag.

## Run it

```bash
npm install
npm start
```

The server listens on `http://localhost:3000` by default (override with the
`PORT` environment variable). Open that URL in a browser for a terminal-styled
reference page listing every endpoint, or use the examples below.

For auto-restart on file changes during development:

```bash
npm run dev
```

## Run the tests

```bash
npm test
```

11 tests cover listing/filtering, fetching, creating, validation failures,
partial updates, deletion, and the checkout/return workflow.

## Endpoints

| Method | Path                      | Description                                              |
| ------ | ------------------------- | --------------------------------------------------------- |
| GET    | `/api/books`               | List books. Optional `?author=` and `?available=` filters |
| GET    | `/api/books/:id`            | Fetch a single book                                       |
| POST   | `/api/books`                | Create a book (`title`, `author`, `isbn`, `publishedYear`) |
| PUT    | `/api/books/:id`            | Replace a book's fields entirely                          |
| PATCH  | `/api/books/:id`            | Update one or more fields                                 |
| DELETE | `/api/books/:id`            | Remove a book                                              |
| POST   | `/api/books/:id/checkout`   | Mark a book unavailable (400 if already checked out)       |
| POST   | `/api/books/:id/return`     | Mark a book available again                                |
| GET    | `/api/health`               | Liveness check                                              |

Successful responses are shaped as `{ "data": ... }` (list endpoints add a
`count`). Errors are shaped as `{ "error": { "message": ..., "details"?: [...] } }`.

## Example requests

```bash
# List available books by an author
curl "http://localhost:3000/api/books?author=Fowler&available=true"

# Create a book
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"Refactoring","author":"Martin Fowler","isbn":"9780134757599","publishedYear":2018}'

# Check a book out, then return it
curl -X POST http://localhost:3000/api/books/<id>/checkout
curl -X POST http://localhost:3000/api/books/<id>/return
```

See `requests.http` for a ready-to-run set of requests if you use the VS
Code "REST Client" extension.

## Project structure

```
server.js                    # entry point
src/app.js                   # express app assembly (used by both server.js and tests)
src/routes/books.routes.js   # route -> controller wiring
src/controllers/books.controller.js
src/data/booksStore.js       # in-memory data store (seeded with 3 books)
src/middleware/notFound.js
src/middleware/errorHandler.js
src/utils/ApiError.js
src/utils/validateBookPayload.js
public/index.html            # API reference page (served at "/")
public/styles.css
tests/books.test.js          # jest + supertest suite
requests.http
```
