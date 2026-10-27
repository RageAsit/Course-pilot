const path = require('path');
const dotenv = require('dotenv');

// Ensure server/.env is loaded reliably regardless of working directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config();

const app = require('./app');
const { connectDB, disconnectDB } = require('./config/db');

const PORT = process.env.PORT || 5000;

/**
 * Strips user credentials or tokens from connection error messages if present
 * @param {string} msg
 * @returns {string}
 */
const sanitizeMessage = (msg) => {
  if (typeof msg !== 'string') return '';
  return msg.replace(/mongodb(\+srv)?:\/\/[^@]+@/gi, 'mongodb$1://<credentials>@');
};

/**
 * Starts the CoursePilot Express server and connects to MongoDB
 * @returns {Promise<import('http').Server>}
 */
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
    const safeMsg = sanitizeMessage(error.message);
    console.error(`[Server Warning] Database connection failed at startup: ${safeMsg}`);
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

  return server;
};

if (require.main === module) {
  startServer();
}

module.exports = {
  startServer,
  app,
};
