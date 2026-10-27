# CoursePilot — Phase 2: Authentication, MongoDB Models, and Assignment API Report

**Date**: October 27, 2026  
**Status**: Completed and Verified  
**Project**: CoursePilot (Academic Planning & Deadline Prioritization SaaS)  
**Author**: Full-Stack Technical Architect  

---

## Executive Summary

Phase 2 implemented the complete authentication system, MongoDB data models, Assignment REST API, and frontend integration following the MVC architectural patterns from the reference repository (Shopkart). All workflows—user registration, login with HttpOnly JWT cookies, session recovery on page refresh, logout, assignment CRUD, completion toggling, and strict database-level ownership isolation—have been fully implemented and verified against both automated test suites and the configured live MongoDB Atlas database.

---

## 1. Files Created and Modified

### Backend (`server/`)
- **Models**:
  - `server/src/models/user.model.js`: User schema with bcrypt password hashing, email indexing, unique constraint, and password sanitization on serialization.
  - `server/src/models/assignment.model.js`: Assignment schema with user reference, field validations, duration constraints (`remainingMinutes <= estimatedMinutes`), and compound indexes.
- **Controllers**:
  - `server/src/controllers/auth.controller.js`: Registration with duplicate email prevention, login with HttpOnly cookie issuance, `/me` profile retrieval, and logout cookie invalidation.
  - `server/src/controllers/assignment.controller.js`: Assignment creation, listing with status/subject query filters, single retrieval, updates, `/complete`, `/reopen`, and deletion with strict user ownership scoping.
- **Routes**:
  - `server/src/routes/auth.routes.js`: Routes for `/api/auth` endpoints.
  - `server/src/routes/assignment.routes.js`: Routes for `/api/assignments` endpoints guarded by `authMiddleware`.
- **Middleware**:
  - `server/src/middleware/auth.middleware.js`: Resolves JWT from HttpOnly cookie (or Bearer header), verifies signature, resolves user from MongoDB, attaches `req.user`.
  - `server/src/middleware/errorHandler.js`: Updated to map Zod errors and Mongoose validation/cast errors to HTTP 400 with clean error messages.
- **Utilities & Validators**:
  - `server/src/utils/generateToken.js`: Signs JWT and sets/clears HttpOnly cookie with production-aware flags (`sameSite`, `secure`, `httpOnly`, 7-day expiration).
  - `server/src/validators/auth.validator.js`: Zod schemas for registration and login validation.
  - `server/src/validators/assignment.validator.js`: Zod schemas for assignment creation and updates.
- **Application Setup**:
  - `server/src/app.js`: Mounted `/api/auth` and `/api/assignments` routes.
- **Automated Tests**:
  - `server/tests/auth.test.js`: 9 integration tests covering registration, login, session retrieval, invalid inputs, and logout.
  - `server/tests/assignment.test.js`: 12 integration tests covering unauthenticated rejection, creation, validation, ownership isolation, complete/reopen, and deletion.
  - `server/tests/health.test.js`: Regression tests for `/api/health`.

### Frontend (`client/`)
- **State & Guards**:
  - `client/src/context/AuthContext.jsx`: React Context managing user session, checking `/api/auth/me` on boot, handling login, registration, and logout.
  - `client/src/components/ProtectedRoute.jsx`: Route guard redirecting unauthenticated users to `/login`.
  - `client/src/components/PublicRoute.jsx`: Route guard redirecting authenticated users away from `/login` and `/register` to `/`.
- **Services**:
  - `client/src/services/api.js`: Enhanced with `patch()` method, query parameter formatting, and auth/assignment helper functions.
- **Pages & Layouts**:
  - `client/src/pages/LoginPage.jsx`: Interactive login form with loading state, error display, and redirect.
  - `client/src/pages/RegisterPage.jsx`: Interactive registration form with input validation, error display, and redirect.
  - `client/src/pages/DashboardPage.jsx`: Real academic assignment dashboard supporting creation, subject filtering, status tabs, completion toggle, editing, and deletion.
  - `client/src/layouts/AppLayout.jsx`: Displays student profile in header and sidebar, and includes functional "Sign Out" button.
  - `client/src/App.jsx`: Configured with `AuthProvider`, `ProtectedRoute`, and `PublicRoute`.

---

## 2. API Endpoints Implemented

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new student, hashes password, sets HttpOnly JWT cookie |
| `POST` | `/api/auth/login` | Public | Authenticates credentials, sets HttpOnly JWT cookie |
| `GET` | `/api/auth/me` | Authenticated | Retrieves current authenticated student's profile |
| `POST` | `/api/auth/logout` | Authenticated | Clears the session cookie |

### Assignments (`/api/assignments`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/assignments` | Authenticated | Creates a new assignment scoped to the authenticated student |
| `GET` | `/api/assignments` | Authenticated | Lists all assignments owned by student (supports `?status=` and `?subject=`) |
| `GET` | `/api/assignments/:id` | Authenticated | Retrieves one owned assignment (returns 404 if unowned) |
| `PATCH` | `/api/assignments/:id` | Authenticated | Updates permitted fields (enforces `remainingMinutes <= estimatedMinutes`) |
| `PATCH` | `/api/assignments/:id/complete`| Authenticated | Marks assignment completed and zeroes remaining minutes |
| `PATCH` | `/api/assignments/:id/reopen` | Authenticated | Reopens completed assignment and restores remaining time |
| `DELETE` | `/api/assignments/:id` | Authenticated | Deletes an owned assignment (returns 404 if unowned) |

---

## 3. Test Execution & Results

### Automated Jest & Supertest Suite (`npm test` in `server/`)
```text
PASS tests/assignment.test.js
PASS tests/auth.test.js
PASS tests/health.test.js

Test Suites: 3 passed, 3 total
Tests:       23 passed, 23 total
Snapshots:   0 total
Time:        2.34 s
Ran all test suites.
```

All 23 unit/integration tests passed, verifying:
- Successful registration with unique email and safe response.
- Rejection of duplicate email registrations with HTTP 409.
- Rejection of invalid registration payloads with HTTP 400.
- Login authentication and HttpOnly cookie issuance.
- Rejection of invalid credentials with generic HTTP 401.
- Session verification via `/api/auth/me` and rejection of invalid/missing tokens.
- Cookie clearing upon logout.
- Rejection of unauthenticated assignment requests with HTTP 401.
- Assignment creation with duration and date validation.
- Rejection of invalid payloads (remaining minutes exceeding estimated minutes).
- User scoping on assignment queries.
- Strict ownership isolation: 404 returned when attempting to read, update, or delete another user's assignment.
- Completion and reopening status toggles.
- Regression testing on `/api/health`.

### Production Build Verification (`npm run build` in `client/`)
```text
vite v5.4.21 building for production...
transforming...
✓ 1589 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                   1.10 kB │ gzip:  0.62 kB
dist/assets/index-B7KNFmvc.css   19.89 kB │ gzip:  4.55 kB
dist/assets/index-C5tAlmeX.js   211.40 kB │ gzip: 63.24 kB
✓ built in 2.81s
```

---

## 4. MongoDB Atlas Persistence Verification

MongoDB Atlas connectivity and persistence were **fully verified**:

1. **Live Health Check**: Querying `http://localhost:5000/api/health` against the running server connected to MongoDB Atlas returned:
   ```json
   {
     "status": "ok",
     "service": "coursepilot-api",
     "database": {
       "status": "connected",
       "ready": true
     }
   }
   ```
2. **Live End-to-End Database Transaction Verification**:
   - Registered student user: `phase2_verify_<timestamp>@university.edu` -> **HTTP 201 Created**.
   - Retrieved session via `/api/auth/me` using HttpOnly cookie -> **HTTP 200 OK**.
   - Created assignment document in MongoDB Atlas -> **HTTP 201 Created**.
   - Listed assignments from MongoDB Atlas -> **HTTP 200 (1 assignment persisted)**.
   - Marked assignment completed in MongoDB Atlas via `PATCH /complete` -> **HTTP 200 (status: completed)**.
   - Cleaned up test record via `DELETE /:id` -> **HTTP 200**.
   - Logged out and cleared cookie -> **HTTP 200**.

---

## 5. Exact Commands to Run Services Independently

### Backend Service (Express)
```bash
cd server
npm run dev
# or: npx nodemon index.js
```
- Listens on `http://localhost:5000`
- Automatically loads `server/.env`

### Frontend Service (React + Vite)
```bash
cd client
npm run dev
```
- Listens on `http://localhost:5173`

---

## 6. Blockers & Unresolved Issues

There are **zero blockers or unresolved issues**. All Phase 2 criteria are complete, tested, and verified.
