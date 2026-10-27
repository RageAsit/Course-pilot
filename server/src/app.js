const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/auth.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const plannerRoutes = require('./routes/planner.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const errorHandler = require('./middleware/errorHandler');
const notFoundHandler = require('./middleware/notFoundHandler');

const app = express();

// Configurable CORS supporting CLIENT_URL and CLIENT_ORIGIN (single or comma-separated)
// Default development and production fallbacks include local Vite dev and the Vercel production frontend
const getAllowedOrigins = () => {
  const originEnvVars = [
    process.env.CLIENT_URL,
    process.env.CLIENT_ORIGIN,
    'https://course-pilot-six.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  return [
    ...new Set(
      originEnvVars
        .filter(Boolean)
        .flatMap((entry) => entry.split(','))
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean)
    ),
  ];
};

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests with no origin (e.g. mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }
    const normalized = origin.trim().replace(/\/+$/, '');
    const allowed = getAllowedOrigins();
    if (allowed.includes(normalized)) {
      return callback(null, true);
    }
    // Deny origin by passing false without throwing an unhandled 500 error
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Accept',
    'X-Requested-With',
    'Origin',
  ],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
  maxAge: 86400, // 24-hour preflight cache
};

// 1. CORS middleware must run before ALL other middleware, body parsers, and API routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 2. Parse JSON and URL-encoded request bodies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 3. Parse HttpOnly cookies for JWT authentication
app.use(cookieParser());

// Mount API routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/planner', plannerRoutes);
app.use('/api/analytics', analyticsRoutes);

// Fallback for unknown API routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

module.exports = app;
