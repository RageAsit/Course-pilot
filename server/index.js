const path = require('path');
const dotenv = require('dotenv');

// Ensure server/.env is loaded reliably when started directly from the server directory
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

// Reuse the existing server startup, Express app, database connection, and graceful shutdown logic
const { startServer } = require('./src/server');

// Launch CoursePilot backend service
startServer();
