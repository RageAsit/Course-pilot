# CoursePilot — Academic Planning SaaS

> Intelligent assignment prioritization, deterministic deadline scoring, study schedule generation, and productivity analytics for college students.

CoursePilot helps students navigate demanding university coursework by transforming chaotic assignment lists into an actionable, priority-ranked study roadmap with capacity-bounded focus sessions, conflict detection, and real-time workload analytics.

## Live Deployment

- **Live App:** [CoursePilot](https://course-pilot-six.vercel.app/login)
- **Backend Health:** [CoursePilot API](https://coursepilot-api-xdmq.onrender.com/api/health)


---

## Features & Core Student Workflows

1. **Secure Student Authentication & Data Isolation**
   - User registration and login with bcrypt password hashing.
   - Session management powered by JSON Web Tokens stored in `HttpOnly`, `SameSite`, `Secure` cookies.
   - Automatic session recovery on page reload (`/api/auth/me`).
   - Strict multi-tenant data isolation scoped by MongoDB user ObjectId.

2. **Assignment & Coursework Management**
   - Full CRUD: Create, edit, complete, reopen, and delete assignments.
   - Tracks course code/subject, title, due date, estimated effort, remaining effort, and 5-point importance ratings.
   - Instant optimistic feedback and status toggle (Mark Complete / Reopen).

3. **Deterministic Priority Scoring Engine (0–100 Scale)**
   - Ranks coursework using a transparent, multi-factor scoring formula:
     - **Deadline Urgency** (0–40 points): Accelerates non-linearly within a 7-day window.
     - **Importance Level** (6–30 points): Directly scaled from user-selected academic weight (1–5).
     - **Remaining Effort** (0–20 points): Rewards tackling long-horizon projects (max at $\ge 5$ hours).
     - **Overdue Bonus** (0–10 points): 10 points awarded to overdue work to ensure immediate triage.
   - **Total Score**: Exact sum capped at 100 with 100% mathematical consistency.
   - Completed assignments receive score 0 and are omitted from active priority queues.

4. **Greedy Capacity-Bounded Study Planner**
   - Configurable planning horizon, daily available study capacity (minutes), and preferred focus block length.
   - Schedules focus blocks greedily across eligible days before assignment deadlines without exceeding daily capacity limits.
   - Never schedules past an assignment's deadline.
   - Identifies unscheduled minutes and generates explicit conflict alerts when workloads exceed available study time.
   - Study plans persist in MongoDB Atlas with instant reload.

5. **Actionable Deadline & Conflict Awareness**
   - Dynamic alert banners on the dashboard flagging tasks due today and overdue coursework requiring immediate rescheduling.
   - Unscheduled work breakdown highlighting bottlenecks before they result in missed deadlines.

6. **Productivity Analytics Dashboard**
   - Genuine, live data aggregation from authenticated student records.
   - Workload by Course bar chart comparing hours per subject.
   - Priority distribution donut chart (Critical, High, Moderate, Low).
   - Daily study schedule capacity utilization chart.
   - Key performance indicators: Total Coursework, Completion Rate, Overdue Count, Total Remaining Hours.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite 5, Tailwind CSS 3, React Router v6, Lucide React, Recharts |
| **Backend** | Node.js 22, Express 4, Mongoose 8, Zod 3, bcryptjs, jsonwebtoken, cookie-parser, CORS |
| **Database** | MongoDB Atlas (Cloud Document Store with TLS Encryption) |
| **Testing** | Jest 29, Supertest 7, Playwright 1.64 |
| **Deployment** | Vercel (Frontend SPA), Render (Backend API), MongoDB Atlas (Database) |

---

## Repository Structure

```
coursePilot/
├── client/                     # Frontend React + Vite application
│   ├── public/                 # Static web assets
│   ├── src/
│   │   ├── components/         # StatusBadge, ProtectedRoute, PublicRoute
│   │   ├── context/            # AuthContext (session management)
│   │   ├── layouts/            # AppLayout (sidebar, navigation, health diagnostics)
│   │   ├── pages/              # Dashboard, Schedule, Analytics, Login, Register, NotFound
│   │   └── services/           # Centralized API client (api.js)
│   ├── vercel.json             # Vercel SPA routing rewrite rules
│   └── package.json
├── server/                     # Backend Express API
│   ├── src/
│   │   ├── config/             # MongoDB Atlas connection & environment config
│   │   ├── controllers/        # Auth, Assignment, StudyPlanner, Analytics controllers
│   │   ├── middleware/         # Auth verification, error handling, not-found handler
│   │   ├── models/             # User, Assignment, StudyPlan Mongoose schemas
│   │   ├── routes/             # REST routes (/api/auth, /api/assignments, /api/schedule, /api/analytics)
│   │   ├── services/           # Priority Engine, Study Planner, Analytics aggregation
│   │   ├── utils/              # Token generation (JWT cookies)
│   │   ├── app.js              # Decoupled Express app (isolated test harness)
│   │   └── server.js           # Server listener & graceful shutdown
│   ├── tests/                  # Jest integration & unit test suites (46 tests)
│   ├── index.js                # Independent server startup entrypoint
│   └── package.json
├── docs/                       # Technical architecture & phase reports
│   ├── ARCHITECTURE.md         # Full architectural specifications
│   ├── PHASE_1_REPORT.md       # Foundation verification
│   ├── PHASE_2_REPORT.md       # Auth & Models verification
│   ├── PHASE_3_REPORT.md       # Priority Engine & Planner verification
│   ├── FINAL_DELIVERY_REPORT.md # Comprehensive final submission report
│   └── demo/                   # Verified product walkthrough video
│       └── coursepilot-demo.webm # 29.32s verified 1280x720 video
├── scripts/                    # Playwright automated demo & E2E verification
│   └── demo-e2e.js
├── render.yaml                 # Render cloud deployment blueprint
├── package.json                # Monorepo root with npm workspaces
└── README.md
```

---

## Local Setup & Quick Start

### 1. Prerequisites
- **Node.js**: `v20.x` or `v22.x` (verified on Node `v22.20.0`)
- **npm**: `v10.x` (verified on `10.9.3`)
- **Git**: `2.x`

### 2. Install Dependencies
Run from the repository root:
```bash
npm install
```

### 3. Environment Variables

Create environment configuration files using `.env.example`:

**Server Configuration (`server/.env`):**
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/coursepilot?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long
CLIENT_ORIGIN=http://localhost:5173
```

**Client Configuration (`client/.env`):**
```ini
VITE_API_URL=http://localhost:5000
```

> **Security Note**: Never commit actual `.env` files or credentials into Git.

### 4. Independent Startup Commands

Start the backend and frontend independently in separate terminals:

```bash
# Terminal 1 — Backend Express API (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — Frontend Vite Client (http://localhost:5173)
cd client
npm run dev
```

Alternatively, launch both services concurrently from the repository root:
```bash
npm run dev
```

---

## REST API Endpoint Summary

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Public | System status, uptime, and MongoDB connectivity |
| `POST` | `/api/auth/register` | Public | Register student account & set HttpOnly cookie |
| `POST` | `/api/auth/login` | Public | Authenticate student & issue session cookie |
| `POST` | `/api/auth/logout` | Public | Clear session cookie |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current authenticated user profile |
| `GET` | `/api/assignments` | Authenticated | List user assignments (filters: `status`, `subject`) |
| `POST` | `/api/assignments` | Authenticated | Create a new assignment |
| `GET` | `/api/assignments/priorities` | Authenticated | Get priority-ranked assignments with factor breakdowns |
| `GET` | `/api/assignments/:id` | Authenticated | Get specific assignment details |
| `PUT` | `/api/assignments/:id` | Authenticated | Update assignment fields |
| `PATCH` | `/api/assignments/:id/complete`| Authenticated | Mark assignment as completed |
| `PATCH` | `/api/assignments/:id/reopen` | Authenticated | Reopen completed assignment |
| `DELETE`| `/api/assignments/:id` | Authenticated | Delete assignment |
| `POST` | `/api/schedule/generate` | Authenticated | Compute and persist capacity-bounded study plan |
| `GET` | `/api/schedule/current` | Authenticated | Retrieve active persisted study plan |
| `GET` | `/api/analytics` | Authenticated | Aggregated metrics, course workload, and priority counts |

---

## Automated Test Commands & Verification

### 1. Backend Test Suite (Jest + Supertest)
```bash
cd server
npm test
```
**Results**:
- **6 / 6 Test Suites Passed** (`tests/analytics.test.js`, `tests/assignment.test.js`, `tests/planner.test.js`, `tests/auth.test.js`, `tests/health.test.js`, `tests/priority.test.js`)
- **46 / 46 Tests Passed (100%)**
- Execution time: ~3.98s

### 2. Frontend Production Bundle Build (Vite)
```bash
cd client
npm run build
```
**Results**:
- Compiled 2,389 modules in 5.37s with zero errors.
- Output assets in `client/dist/`.

### 3. End-to-End Automated Browser Walkthrough (Playwright)
```bash
node scripts/demo-e2e.js
```
**Results**:
- Full student lifecycle verified: User Registration $\rightarrow$ Real MongoDB Assignment Creation $\rightarrow$ Deterministic Priority Queue Ranking $\rightarrow$ Study Schedule Generation $\rightarrow$ Productivity Analytics Visualization $\rightarrow$ Assignment Completion Toggle $\rightarrow$ Secure Sign Out.
- Video captured and verified: `docs/demo/coursepilot-demo.webm` (29.32 seconds, 3.22 MB, 1280x720 25fps).

---

## Product Demo Video

Watch the CoursePilot demo: [View the demo on Google Drive](https://drive.google.com/file/d/1HQZnXCcxgyB9iKvFLDDUF_yzgVXtMNF2/view?usp=sharing)

---
  
## 30-Second Product Demo Video

The verified product walkthrough video is located at:
- **Repository Path**: `docs/demo/coursepilot-demo.webm`
- **Resolution**: 1280 × 720 (High Definition)
- **Duration**: 29.32 seconds
- **File Size**: 3,222,651 bytes (3.22 MB)
- **Storyboard Coverage**:
  - `0–4s`: CoursePilot dark SaaS interface, system health diagnostics (Express API: Online, Atlas: Connected).
  - `4–10s`: Creating realistic academic assignments and inspecting the 0–100 deterministic Priority Queue.
  - `10–18s`: Configuring the Study Planner and generating daily capacity-bounded sessions.
  - `18–25s`: Inspecting the real-time Productivity Analytics dashboard (Workload by Course, Priority distribution).
  - `25–30s`: Marking coursework as completed and logging out back to the protected login screen.

---

## Deployment Configuration

- **Frontend**: Configured for Vercel deployment with `client/vercel.json` SPA rewrite rules.
- **Backend**: Configured for Render deployment with root `render.yaml` specification.
- **Database**: Production MongoDB Atlas cluster with TLS encryption and whitelisted access.
- **Cross-Origin Cookie Security**: In production (`NODE_ENV=production`), authentication cookies automatically configure `sameSite: 'none'`, `secure: true`, and `httpOnly: true` for seamless cross-origin communication between Vercel and Render.

---

## Known Limitations & Future Enhancements

- **Recurring Class Schedules**: Currently, daily capacity is uniform per day; future iterations will support varying class timetables (e.g. higher capacity on weekends).
- **Calendar Export**: Study sessions can be exported via iCal/Google Calendar sync in a future release.
- **Offline Mode**: As a cloud-synchronized SaaS, an active internet connection is required to sync with MongoDB Atlas.




