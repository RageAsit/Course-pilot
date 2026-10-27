# CoursePilot — Technical Architecture Specification (Final v1.0)

CoursePilot is a production-grade academic planning SaaS engineered for college students to manage coursework deadlines, prioritize assignments using a deterministic scoring algorithm, generate realistic study schedules, and visualize productivity analytics.

---

## 1. System Overview

CoursePilot is architected as a decoupled, full-stack web application with strict separation between client presentation, API gateway, business domain services, and database persistence.

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
│   - Priority Scoring Engine (40/30/20/10 Allocation)   │
│   - Study Schedule Planner (Greedy Capacity Allocator) │
│   - Productivity Analytics & Workload Forecaster       │
│   - Conflict & Overdue Detector                        │
└───────────────────────────┬────────────────────────────┘
                            │ Mongoose Driver (TLS)
┌───────────────────────────▼────────────────────────────┐
│                  MongoDB Atlas                         │
│   Document Store: Users, Assignments, StudyPlans       │
└────────────────────────────────────────────────────────┘
```

---

## 2. Frontend Architecture (`/client`)

### 2.1 Technology Stack
- **Framework**: React 18 (SPA)
- **Tooling**: Vite 5 (ESM bundling with sub-second HMR)
- **Styling**: Tailwind CSS v3 with curated dark SaaS palette (charcoal/midnight-navy `#090d16`, slate neutrals `#0f172a`, restrained violet `#7c3aed`, emerald, and amber accents)
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Data Visualization**: Recharts (ResponsiveContainer, BarChart, PieChart, Cell, Tooltip)

### 2.2 Directory Hierarchy
```
client/src/
  ├── components/       # Reusable UI primitives (StatusBadge, Modal, Inputs)
  ├── layouts/          # Application shell (AppLayout, responsive sidebar, navigation, diagnostics)
  ├── pages/            # Top-level view routes (Dashboard, Schedule, Analytics, Login, Register, NotFound)
  ├── context/          # React Context providers (AuthContext with session recovery)
  ├── services/         # Centralized API client (`api.js`) and endpoint services
  └── styles/           # Tailwind CSS directives and global theme tokens
```

### 2.3 State Management & API Communication
- Centralized `ApiClient` wraps the native `fetch` API.
- All requests configure `credentials: 'include'` to automatically exchange HttpOnly session cookies with the backend.
- Base API URL is dynamically retrieved from `import.meta.env.VITE_API_URL` (falling back to `http://localhost:5000` in dev).
- Standardized error parsing guarantees user-friendly messages for network disruptions, validation failures, and authorization barriers.

---

## 3. Backend Architecture (`/server`)

### 3.1 Technology Stack
- **Runtime**: Node.js (v20+ / v22 LTS)
- **Framework**: Express 4
- **Validation**: Zod schema validation
- **Data Modeling**: Mongoose 8 (MongoDB ODM)
- **Authentication**: JSON Web Tokens (`jsonwebtoken`) & `bcryptjs`
- **Testing**: Jest 29 + Supertest 7 (46 integration & unit tests)

### 3.2 Directory Hierarchy
```
server/
  ├── src/
  │   ├── config/         # Database connection and environment loaders
  │   ├── controllers/    # Express route handler logic (auth, assignment, planner, analytics)
  │   ├── middleware/     # Auth, validation, error handler, not-found handler
  │   ├── models/         # Mongoose schemas (User, Assignment, StudyPlan)
  │   ├── routes/         # REST API route definitions (/api/auth, /api/assignments, /api/schedule, /api/analytics)
  │   ├── services/       # Domain business logic (priority.service, studyPlanner.service, analytics.service)
  │   ├── utils/          # Token generation, date utilities, response formatters
  │   ├── app.js          # Express application initialization (testable without DB)
  │   └── server.js       # Production server boot and graceful shutdown listener
  └── tests/              # Automated Jest integration and unit test suites
```

### 3.3 Separation of Concerns: `app.js` vs `server.js`
- `app.js`: Configures middleware (CORS, body parsing, cookies, error handling) and routes. Does **not** bind to a network port or initiate MongoDB connections. This guarantees isolated, fast integration testing via Supertest without leaking open database sockets.
- `server.js`: Handles operational runtime: loads environment variables, calls `connectDB()`, binds to `PORT`, and registers `SIGINT` / `SIGTERM` graceful shutdown listeners.

### 3.4 Middleware Pipeline
1. **Body Parsing**: `express.json({ limit: '1mb' })` with `express.urlencoded`.
2. **Cookie Parsing**: `cookieParser()` for secure HttpOnly cookie extraction.
3. **CORS Enforcement**: Whitelists configured `CLIENT_ORIGIN` with `credentials: true`.
4. **Route Dispatching**: `/api/health`, `/api/auth`, `/api/assignments`, `/api/schedule`, `/api/analytics`.
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

### 4.3 Request Validation & Ownership Isolation
- All inbound request payloads are parsed and validated via Zod schemas before reaching controller logic. Invalid payloads immediately yield structured `400 Bad Request` responses with exact field paths.
- Every assignment and study-plan query scopes strictly to `req.user._id` to prevent unauthorized cross-tenant data leakage.

---

## 5. Domain Business Services

### 5.1 Deterministic Deadline Scoring Algorithm

The Priority Engine evaluates each pending assignment using an exact 0–100 deterministic scoring model with strict additive factor bounds:

$$\text{Priority Score} = \min(100, S_{\text{urgency}} + S_{\text{importance}} + S_{\text{effort}} + S_{\text{overdue}})$$

Where:

1. **Deadline Urgency ($S_{\text{urgency}} \in [0, 40]$ points)**:
   - Calculated as $40 \times (1 - \text{hoursLeft} / 168)$ for tasks due within a 7-day horizon (168 hours).
   - If overdue ($\text{hoursLeft} \le 0$), urgency caps at 40 points.
   - For tasks further out than 7 days, urgency is 0.

2. **Importance Level ($S_{\text{importance}} \in [6, 30]$ points)**:
   - Scaled directly from user importance rating ($1\text{--}5$): $S_{\text{importance}} = \text{importance} \times 6$.

3. **Remaining Effort ($S_{\text{effort}} \in [0, 20]$ points)**:
   - Scaled relative to focus requirement: $S_{\text{effort}} = \min(20, \text{round}((\text{remainingMinutes} / 300) \times 20))$.
   - Reaches maximum 20 points at 5 hours (300 minutes) of remaining work.

4. **Overdue Bonus ($S_{\text{overdue}} \in \{0, 10\}$ points)**:
   - 10 points awarded if $\text{dueDate} < \text{now}$ to prevent critical past-due work from stalling; 0 otherwise.

**Special Rules**:
- Completed assignments always score 0 and are omitted from active priority queues and study plans.
- Stable tie-breaking: ties in total score are broken deterministically by earlier deadline, then higher importance, then higher effort, then created timestamp.

---

### 5.2 Study Schedule Allocation (Greedy Capacity-Bounded Scheduler)

1. **Constraints**:
   - Daily scheduled minutes never exceed `dailyCapacityMinutes`.
   - Sessions are never scheduled on days after an assignment's deadline.
   - Work is distributed in chunks up to `preferredSessionMinutes` (default 45 mins).
2. **Deterministic Sort**:
   - Candidate assignments sorted descending by deterministic priority score.
3. **Allocation**:
   - For each assignment, allocates sessions across available calendar days starting from `startDate` up to `deadlineDate` without exceeding available daily capacity.
4. **Conflict & Overdue Detection**:
   - If work remains unscheduled due to exhausted capacity or passed deadlines, explicit conflict flags and remaining minutes are recorded in `unscheduledTasks`.
5. **Persistence**:
   - Complete plans with calculated schedules, metrics, and settings are saved to MongoDB Atlas in the `StudyPlan` collection, indexed by user.

---

### 5.3 Productivity Analytics Engine

The Analytics service computes real-time performance and workload distribution directly from authenticated student MongoDB records:
- **Assignment Counts**: Total, Pending, Completed, and Overdue.
- **Completion Rate**: Exact percentage of finished coursework.
- **Time Metrics**: Total estimated hours vs. remaining hours required.
- **Workload by Subject**: Aggregated minutes and pending task counts grouped by course code (e.g. CS 452, ECON 312).
- **Priority Distribution**: Categorization of tasks into Critical ($\ge 75$), High ($50\text{--}74$), Moderate ($25\text{--}49$), and Low ($< 25$).
- **Capacity Utilization**: Day-by-day scheduled study time vs. maximum daily capacity from active study plan.
- **Upcoming Deadlines**: Ranked chronological queue of next deadlines with days/hours remaining.

---

## 6. Testing Strategy & QA Results

1. **Backend Integration & Unit Tests** (`server/tests/`):
   - **46 / 46 Passing Tests** across 6 suites:
     - `priority.test.js`: 10 tests verifying factor boundaries (40/30/20/10), sum equality, overdue bonus, completed task exclusions, and tie-breakers.
     - `planner.test.js`: 11 tests verifying capacity limits, session chunking, deadline enforcement, and persistence.
     - `analytics.test.js`: 3 tests verifying real metrics aggregation, course grouping, and empty state resilience.
     - `assignment.test.js`: 10 tests verifying CRUD operations, ownership isolation, status transitions.
     - `auth.test.js`: 10 tests verifying registration, hashing, JWT cookies, session recovery, and logout.
     - `health.test.js`: 2 tests verifying Express and MongoDB connection health diagnostics.
2. **Frontend Production Build**:
   - Vite 5 production build verified: `2389 modules transformed`, zero errors, bundled into clean minified chunks.
3. **Automated E2E Verification & Demo Capture**:
   - Playwright test runner verified complete user journey (registration $\rightarrow$ assignment creation $\rightarrow$ priority queue $\rightarrow$ study planner $\rightarrow$ analytics $\rightarrow$ completion toggle $\rightarrow$ logout).
   - High-definition 1280x720 video recorded and saved at `docs/demo/coursepilot-demo.webm` (29.32 seconds, 3.22 MB).

---

## 7. Deployment Architecture

| Tier | Provider | Configuration |
| :--- | :--- | :--- |
| **Frontend** | Vercel | Single-page app rewrite rule (`client/vercel.json`), environment variable `VITE_API_URL` pointing to Render API. |
| **Backend** | Render | Node.js web service (`render.yaml`), start command `npm start`, environment variables: `PORT`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_ORIGIN`, `NODE_ENV=production`. |
| **Database** | MongoDB Atlas | Cluster with TLS connection string, Whitelisted IP access (`0.0.0.0/0` for cloud PaaS workers). |

---

## 8. Milestone Completion Matrix

- [x] **Phase 1: Project Foundation & Architecture**
- [x] **Phase 2: Authentication, MongoDB Models, and Assignment API**
- [x] **Phase 3: Priority Engine and Automatic Study Planner**
- [x] **Phase 4: Productivity Analytics & Deadline Conflict Awareness**
- [x] **Phase 5: UI Polish, Quality Assurance, Demo Video, and Production Deployment**
