const mongoose = require('mongoose');

/**
 * Maps Mongoose readyState numbers to human-readable strings
 */
const CONNECTION_STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

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
 * Returns current MongoDB connection status
 * @returns {{ state: string, isConnected: boolean }}
 */
const getDatabaseStatus = () => {
  const readyState = mongoose.connection.readyState;
  return {
    state: CONNECTION_STATES[readyState] || 'unknown',
    isConnected: readyState === 1,
  };
};

/**
 * Connect to MongoDB Atlas
 * @param {string} [uri] Optional URI override (falls back to process.env.MONGODB_URI)
 * @returns {Promise<mongoose.Connection>}
 */
const connectDB = async (uri = process.env.MONGODB_URI) => {
  if (!uri) {
    const errorMsg = 'MONGODB_URI environment variable is not defined. Database connection skipped.';
    console.warn(`[Database Warning] ${errorMsg}`);
    return null;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Fail fast if connection cannot be established
    });

    console.log(`[Database] MongoDB connected: ${conn.connection.host}`);
    return conn.connection;
  } catch (error) {
    const safeMsg = sanitizeMessage(error.message);
    console.error(`[Database Error] MongoDB connection failure: ${safeMsg}`);
    // Do not swallow the error during deliberate server boot
    throw error;
  }
};

/**
 * Disconnect from MongoDB (useful for test teardown)
 */
const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected');
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  getDatabaseStatus,
};
