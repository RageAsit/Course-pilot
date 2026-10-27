# CoursePilot — Academic Planning SaaS

> Intelligent assignment prioritization, deterministic deadline scoring, and study schedule generation for college students.

CoursePilot is built to help students balance rigorous coursework by calculating deterministic priority scores, generating realistic daily study blocks, flagging scheduling bottlenecks, and tracking completed work through rich visual analytics.

---

## Current Status: Phase 1 Completed

- [x] **Phase 1: Project Foundation & Architecture**
  - Monorepo structure with npm workspaces (`client`, `server`, `docs`).
  - Express backend foundation with decoupled `app.js` and `server.js`.
  - Configurable CORS with credentials, JSON parsing, 404 handler, and centralized error handling.
  - Live `/api/health` endpoint reporting uptime and MongoDB Atlas connectivity.
  - React 18 + Vite frontend with Tailwind CSS dark premium SaaS aesthetic.
  - Centralized API client configured for HttpOnly cookie authentication.
  - Jest & Supertest integration test suite passing.
  - Production build verified.
- [ ] **Phase 2: Authentication & User Accounts** (Next)
- [ ] **Phase 3: Assignment Management & Deterministic Scoring**
- [ ] **Phase 4: Study Schedule Generator & Conflict Detection**
- [ ] **Phase 5: Productivity Analytics & Cloud Deployment**

---

## Technology Stack

- **Frontend**: React 18, Vite, JavaScript, Tailwind CSS, React Router v6, Lucide React, Recharts.
- **Backend**: Node.js 22, Express 4, MongoDB Atlas (Mongoose 8), Zod, bcryptjs, jsonwebtoken, cookie-parser.
- **Testing**: Jest 29, Supertest 7.
- **Deployment Targets**: Vercel (Frontend), Render (Backend), MongoDB Atlas (Database).

---

## Prerequisites

- **Node.js**: `v20.x` or `v22.x` (verified on `v22.20.0`)
- **npm**: `v10.x` (verified on `10.9.3`)
- **Git**: `2.x`

---

## Quick Start & Local Setup

### 1. Install Dependencies
Install all workspace dependencies from the root directory:
```bash
npm install
```

### 2. Environment Configuration
Copy the provided environment template:
```bash
# Server configuration
cp .env.example server/.env

# Client configuration
cp .env.example client/.env
```

Review and adjust variables:
- `server/.env`: Configure `PORT=5000`, `MONGODB_URI` (MongoDB Atlas connection string), `JWT_SECRET`, and `CLIENT_ORIGIN=http://localhost:5173`.
- `client/.env`: Configure `VITE_API_URL=http://localhost:5000`.

*Note: For Phase 1 verification, the server runs out-of-the-box and accurately reports `database.ready: false` if `MONGODB_URI` has not yet been set.*

### 3. Run Development Servers

#### Option A: Run Services Independently (Recommended)
You can navigate into each folder and run them in separate terminals:

```bash
# Terminal 1 — Backend (http://localhost:5000)
cd server
npm run dev              # or: npx nodemon index.js

# Terminal 2 — Frontend (http://localhost:5173)
cd client
npm run dev
```

#### Option B: Run Concurrently from Project Root
```bash
# Run both Backend and Frontend concurrently from root
npm run dev

# Or run individual workspaces from root
npm run dev:server
npm run dev:client
```

### 4. Run Automated Tests
Execute backend integration tests using Jest and Supertest:
```bash
npm run test:server
```

### 5. Verify Production Build
Validate the client production bundle:
```bash
npm run build:client
```

---

## Directory Structure

```text
coursePilot/
├── client/                     # Frontend React SPA
│   ├── public/                 # Static assets & favicon
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Application layout shells
│   │   ├── pages/              # View routes (Dashboard, Login, Register, 404)
│   │   ├── services/           # Centralized API client (`api.js`)
│   │   ├── styles/             # Tailwind CSS stylesheets
│   │   ├── utils/              # Utility functions
│   │   ├── App.jsx             # Route definitions
│   │   └── main.jsx            # React DOM mounting
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── server/                     # Backend REST API
│   ├── src/
│   │   ├── config/             # Database connection & config
│   │   ├── controllers/        # Route controllers
│   │   ├── middleware/         # Error, not-found, and auth middleware
│   │   ├── models/             # Mongoose database models
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business domain services
│   │   ├── utils/              # Server helpers
│   │   ├── app.js              # Express app setup (importable without side-effects)
│   │   └── server.js           # Server listen & lifecycle entrypoint
│   ├── tests/                  # Integration tests (health.test.js)
│   ├── index.js                # Server entrypoint for nodemon/independent execution
│   ├── nodemon.json            # Nodemon file watcher configuration
│   └── package.json
├── docs/
│   └── ARCHITECTURE.md         # Full system architectural specification
├── .env.example                # Safe environment variable template
├── .gitignore                  # Git ignore rules
├── package.json                # Root package with workspace orchestration
└── README.md                   # Project overview & documentation
```

---

## Architecture Documentation

See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for full technical documentation on:
- API and middleware pipelines.
- Deterministic priority scoring algorithm design.
- Constraint-based study schedule generator.
- Authentication security models (HttpOnly JWT cookies).
- MongoDB schema specifications.
