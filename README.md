# Full-Stack Engineering Lab 🧪

A comprehensive monorepo of **10 specialized, practical engineering projects** spanning production-grade backend distributed systems, RESTful microservices, event-driven architectures, and interactive React frontend applications.

Every project in this laboratory is built around a distinct, real-world industrial or tactile simulation theme—pairing robust software patterns with interactive interfaces for testing and demonstration.

---

## 📑 Table of Contents

- [Repository Architecture](#-repository-architecture)
- [Project Matrix & Quick Reference](#-project-matrix--quick-reference)
- [Backend Systems & Microservices (6 Projects)](#-backend-systems--microservices)
  - [1. Access Control System](#1-access-control-system)
  - [2. Dyno Load Test Cell](#2-dyno-load-test-cell)
  - [3. Library Catalog API](#3-library-catalog-api)
  - [4. Parcel Depot API](#4-parcel-depot-api)
  - [5. QC Inspection API](#5-qc-inspection-api)
  - [6. Relay Station Webhook Hub](#6-relay-station-webhook-hub)
- [Frontend React Applications (4 Projects)](#-frontend-react-applications)
  - [7. Paint Swatch Station](#7-paint-swatch-station)
  - [8. Student Profile Card](#8-student-profile-card)
  - [9. Student Roster Register](#9-student-roster-register)
  - [10. Mechanical Tally Counter](#10-mechanical-tally-counter)
- [Getting Started & Local Setup](#-getting-started--local-setup)
- [Testing & Quality Assurance](#-testing--quality-assurance)

---

## 🏛️ Repository Architecture

The repository is organized into standalone project directories. Each directory contains its own dependencies, source code, test suites, and documentation.

```text
fullstack-engineering-lab/
├── .gitignore
├── README.md
│
├── ⚙️ BACKEND SERVICES & APIS
│   ├── access-control-system/access-control-system/
│   │   ├── src/ (controllers, middleware, models, routes)
│   │   ├── public/ (Security checkpoint badge UI)
│   │   ├── tests/ (Jest + Supertest auth tests)
│   │   └── server.js
│   │
│   ├── dyno-load-test/dyno-load-test/
│   │   ├── src/ (engine load generator, SSE emitter, target endpoints)
│   │   ├── public/ (Engine dynamometer telemetry dashboard)
│   │   └── server.js
│   │
│   ├── library-catalog-api/library-catalog-api/
│   │   ├── src/ (Express app, REST controllers, validation middleware)
│   │   ├── tests/ (Integration test suite)
│   │   └── server.js
│   │
│   ├── parcel-depot-api/parcel-depot-api/
│   │   ├── src/ (Multer file upload engine, disk storage, mime validators)
│   │   ├── public/ (Receiving dock depot UI)
│   │   ├── uploads/ (Uploaded assets directory)
│   │   └── server.js
│   │
│   ├── qc-inspection-api/qc-inspection-api/
│   │   ├── src/ (Schema-driven validator middleware, centralized errors)
│   │   ├── public/ (Quality Control inspection station UI)
│   │   └── server.js
│   │
│   └── relay-station/relay-station/
│       ├── src/ (Dispatcher service, Receiver service, HMAC signing, retries)
│       ├── public/ (Telegraph control room SSE dashboard)
│       └── server.js
│
└── 🎨 FRONTEND REACT APPLICATIONS
    ├── paint-swatch-station-app/paint-swatch-app/
    │   ├── src/ (Color state management, paint chip UI)
    │   └── vite.config.js
    │
    ├── student-profile-card-app/student-profile-app/
    │   ├── src/ (Component props, registrar index card design)
    │   └── vite.config.js
    │
    ├── student-roster-register-app/student-roster-app/
    │   ├── src/ (Array mapping, roster ledger UI)
    │   └── vite.config.js
    │
    └── tally-counter-app/counter-app/
        ├── src/ (useState click-counter, split-flap digit display)
        └── vite.config.js
```

---

## 📊 Project Matrix & Quick Reference

| # | Project Name | Domain / Focus | Key Technologies | Interface Theme | Default Port |
|---|---|---|---|---|:---:|
| **01** | `access-control-system` | Auth & Security | Node.js, Express, JWT, Bcrypt | Badge Office Checkpoint | `http://localhost:3000` |
| **02** | `dyno-load-test` | Performance & SSE | Express, Server-Sent Events, Load Generator | Engine Dyno Cell | `5000` & `5001` |
| **03** | `library-catalog-api` | RESTful API | Express, Jest, Supertest | REST Endpoints / JSON | `http://localhost:3000` |
| **04** | `parcel-depot-api` | File Processing | Express, Multer, Disk Storage | Receiving Dock UI | `http://localhost:3000` |
| **05** | `qc-inspection-api` | Validation Middleware | Express, Schema Validator, Error Handler | QC Inspection Station | `http://localhost:3000` |
| **06** | `relay-station` | Distributed Webhooks | Node.js, HMAC SHA-256, SSE, Fetch | Telegraph Control Room | `4000` & `4001` |
| **07** | `paint-swatch-station-app` | Dynamic State | React 18, Vite, Modern CSS | Paint-Chip Counter | Vite Dev Server |
| **08** | `student-profile-card-app` | Component Props | React 18, Vite | Registrar Index Card | Vite Dev Server |
| **09** | `student-roster-register-app` | List Rendering | React 18, Vite | School Register Ledger | Vite Dev Server |
| **10** | `tally-counter-app` | State Management | React 18, Vite, `useState` | Split-Flap Tally Counter | Vite Dev Server |

---

## ⚙️ Backend Systems & Microservices

### 1. Access Control System
> **Location:** `access-control-system/access-control-system`

An end-to-end authentication and authorization microservice implementing modern security standards:
- **Dual-Token Architecture:** Short-lived JWT access tokens paired with secure refresh tokens stored in `httpOnly`, `SameSite` cookies.
- **Role-Based Access Control (RBAC):** Middleware enforcing role hierarchy (`guest`, `operator`, `supervisor`, `admin`).
- **Interactive Badge Office:** Built-in dashboard to simulate badge swipe logins, permission elevation, and token revocation.
- **Commands:**
  ```bash
  npm install
  npm run dev   # Runs on http://localhost:3000
  npm test      # Automated Jest auth test suite
  ```

---

### 2. Dyno Load Test Cell
> **Location:** `dyno-load-test/dyno-load-test`

A full-featured load testing harness and real-time telemetry suite:
- **Dual-Service Engine:** Runs both a configurable target application under test (Port `5000`) and an orchestration control room (Port `5001`).
- **Real-Time Telemetry:** Streams live p50, p95, p99 latencies, throughput, and error rates via Server-Sent Events (SSE).
- **Industrial Dyno Interface:** Styled like an engine dynamometer test bench with live needle tachometers and printed test strips.
- **Commands:**
  ```bash
  npm install
  npm run dev   # Runs target (5000) and control UI (5001)
  npm test
  ```

---

### 3. Library Catalog API
> **Location:** `library-catalog-api/library-catalog-api`

A clean, production-standard RESTful API adhering strictly to REST conventions:
- **Architectural Separation:** Strict separation between Express application setup (`src/app.js`) and network server listener (`server.js`) for test isolation.
- **Full CRUD & Workflows:** Complete resource management with lifecycle transitions (`/books/:id/checkout`, `/books/:id/return`).
- **Rigorous Testing:** Comprehensive integration testing using Jest and Supertest.
- **Commands:**
  ```bash
  npm install
  npm run dev   # Runs on http://localhost:3000
  npm test      # Runs Jest + Supertest suites
  ```

---

### 4. Parcel Depot API
> **Location:** `parcel-depot-api/parcel-depot-api`

A multipart file upload and asset streaming API:
- **Robust Ingestion:** Built on Express and Multer with MIME-type allowlisting, file-size limits, and collision-resistant filename hashing.
- **Asset Lifecycle:** Endpoints for metadata inspection, safe content downloading, and deletion.
- **Receiving Dock UI:** Industrial loading-dock UI to drag-and-drop test files and inspect multipart HTTP payloads.
- **Commands:**
  ```bash
  npm install
  npm run dev   # Runs on http://localhost:3000
  npm test
  ```

---

### 5. QC Inspection API
> **Location:** `qc-inspection-api/qc-inspection-api`

A service demonstrating schema-driven request validation and centralized error handling:
- **Declarative Validation:** Reusable schema validators that inspect headers, query parameters, and JSON payloads before reaching business logic.
- **Uniform Error Envelope:** Consistent JSON RFC-7807 style error responses.
- **Quality Control UI:** An interactive inspection terminal to purposefully trigger edge cases and verify validation rejection responses.
- **Commands:**
  ```bash
  npm install
  npm run dev   # Runs on http://localhost:3000
  npm test
  ```

---

### 6. Relay Station Webhook Hub
> **Location:** `relay-station/relay-station`

A distributed event publishing and webhook delivery system:
- **Dispatcher & Receiver:** Two distinct services simulating third-party webhook delivery.
- **Security & Reliability:** HMAC SHA-256 signature verification headers (`X-Hub-Signature`) with automatic exponential-backoff retries.
- **Live Telegraph UI:** Live Server-Sent Events (SSE) feed visualizing event dispatch, signature generation, and receipt acknowledgment.
- **Commands:**
  ```bash
  npm install
  npm run dev   # Runs Dispatcher (4000) and Receiver (4001)
  npm test
  ```

---

## 🎨 Frontend React Applications

### 7. Paint Swatch Station
> **Location:** `paint-swatch-station-app/paint-swatch-app`
- **Focus:** Dynamic UI state, background canvas manipulation, and tactile user feedback.
- **Design:** Styled as a hardware store paint-chip display counter with real-time swatch transitions.
- **Commands:**
  ```bash
  npm install
  npm run dev
  ```

---

### 8. Student Profile Card
> **Location:** `student-profile-card-app/student-profile-app`
- **Focus:** Component composition, reusable properties (`props`), conditional badges, and structured layouts.
- **Design:** Styled as a university registrar's vintage index card file.
- **Commands:**
  ```bash
  npm install
  npm run dev
  ```

---

### 9. Student Roster Register
> **Location:** `student-roster-register-app/student-roster-app`
- **Focus:** Array iteration (`.map`), dynamic keys, tabular layout styling, and status indicators.
- **Design:** Styled as an authentic school attendance and grade ledger.
- **Commands:**
  ```bash
  npm install
  npm run dev
  ```

---

### 10. Mechanical Tally Counter
> **Location:** `tally-counter-app/counter-app`
- **Focus:** React `useState` lifecycle, state boundary handling (increment, decrement, reset), and keyboard events.
- **Design:** Styled as a handheld chrome mechanical click-counter featuring split-flap digit animations.
- **Commands:**
  ```bash
  npm install
  npm run dev
  ```

---

## 🚀 Getting Started & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.x or 20.x LTS recommended)
- `npm` (version 9.x or later)
- [Git](https://git-scm.com/)

### Clone the Repository
```bash
git clone https://github.com/Arshitraj-123/fullstack-engineering-lab.git
cd fullstack-engineering-lab
```

### Running Any Project
Navigate directly to the nested directory of the project you want to test:

```bash
# Example: Running the Access Control System
cd access-control-system/access-control-system
npm install
npm run dev

# Example: Running the Tally Counter React App
cd tally-counter-app/counter-app
npm install
npm run dev
```

---

## 🧪 Testing & Quality Assurance

All backend projects include automated integration tests built with **Jest** and **Supertest**. Run tests inside any backend service directory:

```bash
cd library-catalog-api/library-catalog-api
npm test
```

---

## 👤 Author

- **Arshit Raj**
- GitHub: [@Arshitraj-123](https://github.com/Arshitraj-123)
- Repository: [fullstack-engineering-lab](https://github.com/Arshitraj-123/fullstack-engineering-lab)
