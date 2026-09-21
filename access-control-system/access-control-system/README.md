# Access Control System

A user authentication and authorization system for a backend application,
built with **Node.js**, **Express**, and **JWT** — plus a small UI styled
as a security checkpoint / badge office, so the whole flow is visible and
testable without a separate API client.

## Why this design

- **Two token types, two jobs.** The **access token** is a short-lived
  JWT (15 min by default) sent as `Authorization: Bearer <token>` and
  verified statelessly on every request. The **refresh token** is a
  long-lived opaque random string, stored server-side and delivered only
  as an `httpOnly`, `SameSite=Strict` cookie — JavaScript in the browser
  can never read it, which limits the blast radius of an XSS bug.
- **Refresh token rotation.** Every call to `/api/auth/refresh` invalidates
  the token it was given and issues a new one. If a refresh token is ever
  stolen and replayed after the legitimate client has already rotated it,
  the stolen copy is already dead.
- **No client-supplied roles.** `POST /api/auth/register` always creates a
  `user`-role account; the request body's `role` field (if present) is
  ignored server-side. Letting a client choose its own role is a classic
  privilege-escalation bug, so there's a seeded `admin` account instead
  (see below) for testing admin-only routes.
- **Brute-force throttling.** Repeated failed logins for the same email
  lock out further attempts for a cooldown window (`src/data/loginAttemptStore.js`).
- **One error shape everywhere**, and the same `src/app.js`-factory /
  `server.js`-entry split used in the companion REST API project, so the
  test suite exercises the real Express app in-process.

## Run it

```bash
npm install
npm start
```

Open `http://localhost:3000` — you'll land on the **Checkpoint** screen.

Seeded admin login (created fresh on every server start, since the store
is in-memory):

```
admin@accesscontrol.local / Admin123!
```

Or use "New badge request" to register your own account (always issued
standard/user clearance).

For auto-restart on file changes:

```bash
npm run dev
```

## Run the tests

```bash
npm test
```

15 tests cover registration (including the privilege-escalation guard and
weak-password/duplicate-email rejection), login (including lockout),
`/me` with a missing/invalid/valid token, admin-only access control, and
the full refresh-rotation and logout/revocation flow.

## The UI

- **Checkpoint (signed out):** a clipboard-styled intake form with tabs
  for *Sign in* and *New badge request*. A failed login stamps
  "ACCESS DENIED" in red; a successful one stamps "ACCESS GRANTED" in
  green before showing your badge.
- **Badge (signed in):** an ID-badge card — name, badge ID, email, issue
  date, and a clearance band colored by role (steel blue for `user`,
  brass/gold for `admin`).
- **Security roster (admin only):** a table of every registered account
  and its clearance level, fetched from the admin-only `/api/users`
  endpoint — simply absent from the DOM for non-admin accounts.
- The access token is kept in a JavaScript variable, never
  `localStorage`. On page load, the app silently calls `/api/auth/refresh`
  (which relies on the `httpOnly` cookie) to restore your session without
  asking you to sign in again.

## Endpoints

| Method | Path                | Auth required | Description                                             |
| ------ | ------------------- | -------------- | -------------------------------------------------------- |
| POST   | `/api/auth/register`  | No             | Create a `user`-role account                              |
| POST   | `/api/auth/login`     | No             | Authenticate; sets refresh cookie, returns access token   |
| POST   | `/api/auth/refresh`   | Refresh cookie | Rotates the refresh token, issues a new access token       |
| POST   | `/api/auth/logout`    | Refresh cookie | Revokes the refresh token, clears the cookie                |
| GET    | `/api/auth/me`        | Access token   | Returns the current account's profile                       |
| GET    | `/api/users`          | Access token, `admin` role | Lists every account (the security roster)     |
| GET    | `/api/health`         | No             | Liveness check                                               |

Successful responses are shaped as `{ "data": ... }`. Errors are shaped as
`{ "error": { "message": ..., "details"?: [...] } }`.

## Configuration

Copy `.env.example` to `.env` to override any default (JWT secret, token
lifetimes, bcrypt cost, lockout threshold, seeded admin credentials). See
that file for the full list — every value has a sane default for local
development if left unset.

## Project structure

```
server.js                        # entry point (loads .env, starts the server)
src/app.js                       # express app assembly (used by both server.js and tests)
src/config.js                    # all tunables, env-overridable
src/routes/auth.routes.js
src/routes/users.routes.js
src/controllers/auth.controller.js
src/controllers/users.controller.js
src/data/usersStore.js           # in-memory users, seeded with one admin
src/data/refreshTokenStore.js    # in-memory, revocable refresh tokens
src/data/loginAttemptStore.js    # brute-force lockout tracking
src/middleware/authenticate.js   # verifies the access token
src/middleware/authorize.js      # role-based access control
src/middleware/notFound.js
src/middleware/errorHandler.js
src/utils/ApiError.js
src/utils/tokens.js              # JWT sign/verify
src/utils/validators.js
public/index.html                # Checkpoint / Badge UI
public/styles.css
public/app.js
tests/auth.test.js               # jest + supertest suite (15 tests)
.env.example
```

## Note on the in-memory store

Users, refresh tokens, and login-attempt counters all live in memory and
reset when the process restarts — this keeps the project runnable with
zero setup. Swapping in a real database only touches
`src/data/*Store.js`; nothing in the controllers, routes, or middleware
would need to change.
