# CoursePilot — Technical Architecture Specification

CoursePilot is a production-minded academic planning SaaS engineered for college students to manage coursework deadlines, prioritize assignments using a deterministic scoring algorithm, generate realistic study schedules, and visualize productivity analytics.

---

## 1. System Overview

CoursePilot is architected as a decoupled, full-stack web application with clear separation between client presentation, API gateway, business domain services, and database persistence.

```
┌────────────────────────────────────────────────────────┐
│                   Vercel Frontend                      │
│   React 18 + Vite + Tailwind CSS + React Router +      │
│   Lucide Icons + Recharts Analytics                    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / REST (JSON + Cookies)
                            │ withCredentials: true
┌───────────────────────────▼────────────────────────────┐
│                    Render Backend                      │
│   Express API + Zod Validation + JWT HttpOnly Auth +   │
│   Centralized Error Handling                           │
├────────────────────────────────────────────────────────┤
│                Domain Service Layer                    │
│   - Priority Scoring Engine (Deterministic Math)       │
│   - Study Schedule Generator (Constraint Allocation)   │
│   - Conflict & Overdue Detector                        │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose Driver (TLS)
┌───────────────────────────▼────────────────────────────┐
│                  MongoDB Atlas                         │
│   Document Store: Users, Assignments, StudySessions    │
└────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture (`/client`)

### 2.1 Technology Stack
- **Framework**: React 18 (SPA)
- **Tooling**: Vite (ESM fast builds)
- **Styling**: Tailwind CSS v3 with curated dark SaaS palette (charcoal/midnight-navy `#090d16`, slate neutrals `#0f172a`, restrained violet `#7c3aed` and blue accents)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Data Visualization**: Recharts

### 2.2 Directory Hierarchy
```
client/src/
  ├── components/       # Reusable UI primitives (StatusBadge, Modal, Inputs)
  ├── layouts/          # Application shell (AppLayout, responsive sidebar, navigation)
  ├── pages/            # Top-level view routes (Dashboard, Login, Register, NotFound)
  ├── hooks/            # Custom React hooks (useAuth, useAssignments, useSchedule)
  ├── context/          # React Context providers (AuthContext, ThemeContext)
  ├── services/         # Centralized API client (`api.js`) and endpoint services
  ├── utils/            # Client formatting helpers (dates, priority colors, math)
  └── styles/           # Tailwind CSS directives and global theme tokens
```

### 2.3 State Management & API Communication
- Centralized `ApiClient` wraps the native `fetch` API.
- All requests configure `credentials: 'include'` to automatically exchange HttpOnly session cookies with the backend.
- Base API URL is dynamically retrieved from `import.meta.env.VITE_API_URL`.
- Standardized error parsing guarantees user-friendly messages for network disruptions, validation failures, and authorization barriers.

---

## 3. Backend Architecture (`/server`)

### 3.1 Technology Stack
- **Runtime**: Node.js (v20+ / v22 LTS)
- **Framework**: Express 4
- **Validation**: Zod schema validation
- **Data Modeling**: Mongoose 8 (MongoDB ODM)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Testing**: Jest 29 + Supertest 7

### 3.2 Directory Hierarchy
```
server/
  ├── src/
  │   ├── config/         # Database connection and environment loaders
  │   ├── controllers/    # Express route handler logic
  │   ├── middleware/     # Auth, validation, error handler, not-found handler
  │   ├── models/         # Mongoose schemas (User, Assignment, StudySession)
  │   ├── routes/         # REST API route definitions
  │   ├── services/       # Domain business logic (scoring, scheduling, analytics)
  │   ├── utils/          # Token generation, date utilities, response formatters
  │   ├── app.js          # Express application initialization (testable without DB)
  │   └── server.js       # Production server boot and graceful shutdown listener
  └── tests/              # Jest integration tests
```

### 3.3 Separation of Concerns: `app.js` vs `server.js`
- `app.js`: Configures middleware (CORS, body parsing, cookies, error handling) and routes. Does **not** bind to a network port or initiate MongoDB connections. This guarantees isolated, fast integration testing via Supertest without leaking open database sockets.
- `server.js`: Handles operational runtime: loads environment variables, calls `connectDB()`, binds to `PORT`, and registers `SIGINT` / `SIGTERM` graceful shutdown listeners.

### 3.4 Middleware Pipeline
1. **Body Parsing**: `express.json({ limit: '1mb' })` with `express.urlencoded`.
2. **Cookie Parsing**: `cookieParser()` for secure HttpOnly cookie extraction.
3. **CORS Enforcement**: Whitelists configured `CLIENT_ORIGIN` with `credentials: true`.
4. **Route Dispatching**: `/api/health`, `/api/auth` (Phase 2), `/api/assignments` (Phase 3), `/api/schedule` (Phase 4).
5. **404 Not Found Handler**: Catches unmatched routes and formats JSON 404 responses.
6. **Centralized Error Handler**: Translates Zod errors, Mongoose validation errors, and runtime exceptions into consistent JSON envelopes (`{ success: false, error: { message, status } }`).

---

## 4. Authentication & Security Architecture

### 4.1 Token Storage & Transport
- **Mechanism**: JSON Web Tokens (JWT) signed with HMAC-SHA256 using `JWT_SECRET`.
- **Storage**: Set in an `HttpOnly`, `SameSite=Lax` (or `None` with `Secure` in cross-site production), secure cookie.
- **Security Rationale**: Tokens stored in HttpOnly cookies are immune to Cross-Site Scripting (XSS) token exfiltration, unlike `localStorage`.

### 4.2 Password Security
- Passwords hashed using `bcryptjs` with salt round factor of 10.
- Raw passwords never logged, stored in plaintext, or returned in database queries (`select: false`).

### 4.3 Request Validation
- All inbound request payloads are parsed and validated via Zod schemas before reaching controller logic. Invalid payloads immediately yield structured `400 Bad Request` responses with exact field paths.

---

## 5. Database Architecture (MongoDB Atlas)

### 5.1 Entities & Relationships
1. **User**:
   - `_id`: ObjectId
   - `name`: String
   - `email`: String (unique index, lowercase, trimmed)
   - `password`: String (hashed, hidden by default)
   - `preferences`: Daily study capacity (hours), preferred study days
   - `createdAt`, `updatedAt`: Timestamps

2. **Assignment**:
   - `_id`: ObjectId
   - `userId`: ObjectId (indexed, ref: User)
   - `title`: String
   - `course`: String
   - `dueDate`: Date (indexed)
   - `estimatedHours`: Number
   - `weight`: Number (percentage of course grade, 1–100)
   - `difficulty`: String enum (`low`, `medium`, `high`)
   - `status`: String enum (`pending`, `in_progress`, `completed`)
   - `calculatedPriority`: Number (computed via scoring engine)
   - `completedAt`: Date (nullable)
   - `createdAt`, `updatedAt`: Timestamps

3. **StudySession**:
   - `_id`: ObjectId
   - `userId`: ObjectId (indexed, ref: User)
   - `assignmentId`: ObjectId (ref: Assignment)
   - `date`: Date
   - `durationMinutes`: Number
   - `status`: String enum (`scheduled`, `completed`, `skipped`)

### 5.2 Connection Resilience & Health Reporting
- Mongoose connection state is monitored via `mongoose.connection.readyState`.
- The `/api/health` endpoint explicitly verifies if MongoDB is `connected`, `connecting`, or `disconnected`. The server never falsely claims database readiness when disconnected.

---

## 6. Domain Business Services

### 6.1 Deterministic Deadline Scoring Algorithm
Assignments are ranked using a multi-factor deterministic scoring equation rather than simple due-date sorting:

$$\text{Priority Score} = w_1 \cdot \text{Urgency}(t) + w_2 \cdot \text{Weight} + w_3 \cdot \text{Difficulty} + w_4 \cdot \text{Estimated Effort}$$

- **Urgency**: Non-linear escalation as deadline approaches ($1 / \Delta t$).
- **Weight**: Academic impact on overall grade.
- **Difficulty & Effort**: Workload multiplier preventing high-effort projects from being crowded out by trivial tasks.
- **Deterministic**: Given identical inputs, the algorithm always yields identical, predictable orderings.

### 6.2 Study Schedule Allocation
- Constraints: Student's declared daily available study hours, maximum continuous block duration, assignment due dates.
- Allocation: Greedy interval scheduler distributing required assignment effort across eligible days prior to deadlines.
- Conflict Engine: Detects impossible schedules where total required hours before deadline exceed available study capacity, raising explicit conflict flags.

---

## 7. Testing Strategy

1. **Backend Integration Tests** (`server/tests/`):
   - Supertest executes real HTTP calls against the Express app instance.
   - Tests verify health responses, route resolution, 404 handlers, and header configurations.
2. **Unit Tests**:
   - Validation schemas (Zod).
   - Priority scoring calculations with deterministic test cases.
   - Schedule generator edge cases (overlapping deadlines, zero study time).
3. **Frontend Verification**:
   - Production Vite build validation (`npm run build:client`).

---

## 8. Deployment Architecture

| Tier | Provider | Configuration |
| :--- | :--- | :--- |
| **Frontend** | Vercel | Single-page app rewrite rule (`vercel.json`), environment variable `VITE_API_URL` pointing to Render API. |
| **Backend** | Render | Node.js web service, build command `npm install`, start command `npm run start --workspace=server`, environment variables: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV=production`. |
| **Database** | MongoDB Atlas | M0 Free Tier / Dedicated cluster, IP Access List configured for cloud providers (0.0.0.0/0 or Render static outbound IP). |

---

## 9. Phase Roadmap Summary

- [x] **Phase 1: Project Foundation & Architecture** (Current)
- [ ] **Phase 2: Authentication & User Accounts**
- [ ] **Phase 3: Assignment Management & Priority Engine**
- [ ] **Phase 4: Study Schedule Generator & Conflict Detection**
- [ ] **Phase 5: Productivity Analytics, Test Hardening & Production Deployment**
