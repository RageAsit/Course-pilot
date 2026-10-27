require('dotenv').config();
const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

// Attempt database connection on server startup
const startServer = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await connectDB();
    } else {
      console.warn(
        '[Server Notice] MONGODB_URI is not set. Server is running without a connected database. Endpoints requiring persistence will fail.'
      );
    }
  } catch (error) {
    console.error(`[Server Warning] Database connection failed at startup: ${error.message}`);
    console.error('The server will continue running, but database operations will be unavailable.');
  }

  const server = app.listen(PORT, () => {
    console.log(`[CoursePilot Server] Listening on http://localhost:${PORT}`);
    console.log(`[CoursePilot Server] Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // Graceful shutdown handling
  const shutdown = async (signal) => {
    console.log(`\n[CoursePilot Server] Received ${signal}. Closing server gracefully...`);
    server.close(async () => {
      console.log('[CoursePilot Server] HTTP server closed.');
      await disconnectDB();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
