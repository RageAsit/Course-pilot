# CoursePilot — Phase 1: Project Foundation and Architecture Report

**Date**: October 27, 2026  
**Status**: Completed and Verified  
**Project**: CoursePilot (Academic Planning & Deadline Prioritization SaaS)  
**Author**: Full-Stack Technical Architect  

---

## Executive Summary

Phase 1 established the complete architectural and operational foundation for CoursePilot. All foundational criteria—including directory layouts, npm workspaces, dependency compatibility, Express app/server separation, live health diagnostics with honest MongoDB connectivity state, React 18 + Vite frontend with dark premium styling, automated Jest/Supertest testing, Vite production build, safe environment templating, and Git repository initialization—were implemented and verified through live execution.

---

## 1. Directory Structure

The project was constructed as an npm workspace monorepo within `coursePilot/` without nested parent directory duplication:

```text
coursePilot/
├── client/                             # Frontend React SPA (Vite)
│   ├── public/
│   │   └── favicon.svg                 # SVG brand favicon
│   ├── src/
│   │   ├── components/                 # Reusable UI primitives (StatusBadge.jsx)
│   │   ├── context/                    # Context providers (.gitkeep)
│   │   ├── hooks/                      # Custom React hooks (.gitkeep)
│   │   ├── layouts/                    # AppLayout.jsx (Header, Sidebar, System Health monitor)
│   │   ├── pages/                      # DashboardPage, LoginPage, RegisterPage, NotFoundPage
│   │   ├── services/                   # api.js (Centralized API client with cookie credentials)
│   │   ├── styles/                     # index.css (Tailwind base, fonts, scrollbar styles)
│   │   ├── utils/                      # Formatting helpers (.gitkeep)
│   │   ├── App.jsx                     # React Router v6 route configuration
│   │   └── main.jsx                    # React 18 DOM mount
│   ├── index.html                      # HTML5 template with Plus Jakarta Sans & JetBrains Mono
│   ├── package.json                    # Client dependencies & scripts
│   ├── postcss.config.js               # PostCSS with Tailwind & Autoprefixer
│   ├── tailwind.config.js              # Dark premium SaaS design system tokens
│   └── vite.config.js                  # Vite configuration (port 5173)
├── server/                             # Backend REST API (Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                   # Mongoose connection & connection state tracker
│   │   ├── controllers/                # Route controllers (.gitkeep)
│   │   ├── middleware/
│   │   │   ├── errorHandler.js         # Centralized error handler (Zod, Mongoose, HTTP errors)
│   │   │   └── notFoundHandler.js      # 404 handler for unmatched API routes
│   │   ├── models/                     # Mongoose models (.gitkeep)
│   │   ├── routes/
│   │   │   └── healthRoutes.js         # GET /api/health implementation
│   │   ├── services/                   # Business domain services (.gitkeep)
│   │   ├── utils/                      # Server utility helpers (.gitkeep)
│   │   ├── app.js                      # Express app initialization (isolated, no DB side-effects)
│   │   └── server.js                   # Server listen entrypoint & graceful shutdown
│   ├── tests/
│   │   └── health.test.js              # Jest & Supertest integration suite
│   └── package.json                    # Server dependencies & test scripts
├── docs/
│   ├── ARCHITECTURE.md                 # Full system architectural specification
│   └── PHASE_1_REPORT.md               # This verification document
├── .env.example                        # Safe environment variable template
├── .gitignore                          # Git exclusions for dependencies, secrets, and builds
├── package.json                        # Root monorepo workspace orchestration
└── README.md                           # Project overview, setup, and run instructions
```

---

## 2. Technology Stack & Installed Versions

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime** | Node.js | `v22.20.0` | Server runtime |
| **Package Manager** | npm | `10.9.3` | Workspace monorepo manager |
| **VCS** | Git | `2.51.0` | Source control management |
| **Backend Framework** | Express | `^4.21.1` | REST API layer |
| **Database ODM** | Mongoose | `^8.8.1` | MongoDB Atlas driver |
| **Validation** | Zod | `^3.23.8` | Inbound payload validation |
| **Authentication** | jsonwebtoken | `^9.0.2` | JWT generation & verification |
| **Cryptography** | bcryptjs | `^2.4.3` | Salted password hashing |
| **Cookie Parser** | cookie-parser | `^1.4.7` | HttpOnly cookie parsing |
| **CORS** | cors | `^2.8.5` | Origin validation with credentials |
| **Backend Testing** | Jest | `^29.7.0` | Test runner |
| **HTTP Assertions** | Supertest | `^7.0.0` | API integration testing |
| **Frontend Framework** | React | `^18.3.1` | UI presentation layer |
| **Client Bundler** | Vite | `^5.4.11` | ESM build pipeline & dev server |
| **Styling** | Tailwind CSS | `^3.4.15` | Dark SaaS utility theme |
| **Client Routing** | React Router | `^6.28.0` | Client-side page navigation |
| **Icons** | Lucide React | `^0.460.0` | System icons |
| **Visualization** | Recharts | `^2.13.3` | Analytics charting (Phase 5 preparation) |
| **Process Runner** | Concurrently | `^9.1.0` | Parallel workspace dev scripts |

---

## 3. Operational Commands

All commands can be triggered directly from the workspace root:

```bash
# Start both Backend (port 5000) and Frontend (port 5173) concurrently
npm run dev

# Start backend server only in watch mode
npm run dev:server

# Start frontend client only in Vite dev mode
npm run dev:client

# Execute backend integration tests
npm run test:server

# Build the frontend client for production
npm run build:client
```

---

## 4. Verification and Live Test Results

### 4.1 Automated Backend Test Suite (`npm run test:server`)
```text
PASS tests/health.test.js
  GET /api/health
    √ should return 200 OK with health status and accurate database connectivity (141 ms)
    √ should return 404 for undefined API routes (16 ms)

Test Suites: 1 passed, 1 total
Tests:       2 passed, 2 total
Snapshots:   0 total
Time:        1.984 s
Ran all test suites.
```

### 4.2 Live Server Execution & Health Diagnostic Check
The server was started in a dedicated process and queried via HTTP `GET http://localhost:5000/api/health`.

**Response (HTTP 200 OK)**:
```json
{
  "status": "ok",
  "service": "coursepilot-api",
  "timestamp": "2026-10-27T14:17:06.361Z",
  "uptime": 1,
  "environment": "development",
  "database": {
    "status": "disconnected",
    "ready": false
  }
}
```

**Key Verification Finding**:
- The database connection state module tracks Mongoose connection ready states (`0 = disconnected`, `1 = connected`, `2 = connecting`, `3 = disconnecting`).
- The health response honestly and accurately reports `database.ready: false` and `database.status: "disconnected"` when `MONGODB_URI` is unconfigured, preventing false readiness claims.

### 4.3 Live Frontend Development Server Check
The client dev server was booted via `npm run dev:client`. An HTTP request to `http://localhost:5173` returned status code **200 OK**, confirming that React and Vite load correctly.

### 4.4 Production Build Verification (`npm run build:client`)
The client build was executed using Vite:
```text
vite v5.4.21 building for production...
transforming...
✓ 1585 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.10 kB │ gzip:  0.62 kB
dist/assets/index-Bw4yMd1K.css   17.39 kB │ gzip:  4.00 kB
dist/assets/index-B5e9_VIp.js   197.89 kB │ gzip: 60.71 kB
✓ built in 2.57s
```
Zero build warnings, zero missing imports, zero bundling errors.

---

## 5. Security & Architectural Standards Verification

1. **Separation of App vs. Server**:
   - `server/src/app.js` handles routing, CORS, JSON limits, and error middleware without starting listeners or initiating database connections. This allows unit and integration testing without database side-effects or leaking open sockets.
   - `server/src/server.js` manages runtime startup, env loading, Mongoose connection attempts, and graceful shutdown handlers for `SIGINT` / `SIGTERM`.
2. **CORS & Cookie Transport**:
   - CORS is configured with dynamic origin validation against `CLIENT_ORIGIN` (defaulting to `http://localhost:5173`) and `credentials: true`.
   - The centralized frontend API client (`client/src/services/api.js`) enforces `credentials: 'include'` on all HTTP requests to support HttpOnly cookie authentication.
3. **Sensitive Data Protection**:
   - `.gitignore` strictly excludes `.env`, `node_modules/`, `dist/`, logs, and OS files.
   - Verified that no `.env` files or hardcoded credentials exist in source control.
   - Safe `.env.example` provided with documented placeholder strings only.

---

## 6. Git Status & Commits

- **Repository Initialized**: `coursePilot/.git/`
- **Committer Identity**: `RageAsit <asitosahuron@gmail.com>`
- **Initial Commit Hash**: `da9fbdb`
- **Commit Message**: `chore: initialize CoursePilot full-stack foundation`
- **Tracked Files**: 37 files committed across root, client, server, and docs.

---

## 7. Environment Variables Required for Phase 2

Before proceeding with **Phase 2: Authentication & User Accounts**, configure these values in `server/.env`:

| Variable | Target File | Default / Example Value | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | `server/.env` | `5000` | Local backend port |
| `NODE_ENV` | `server/.env` | `development` | Node environment |
| `MONGODB_URI` | `server/.env` | `mongodb+srv://...` | MongoDB Atlas cluster connection string |
| `JWT_SECRET` | `server/.env` | `<32+ char random string>` | Secret key for signing authentication cookies |
| `CLIENT_ORIGIN` | `server/.env` | `http://localhost:5173` | Allowed CORS client origin |
| `VITE_API_URL` | `client/.env` | `http://localhost:5000` | Backend API base URL for the client |

---

## 8. Conclusion & Sign-Off

Phase 1 is complete, verified, and ready for Phase 2 implementation.
