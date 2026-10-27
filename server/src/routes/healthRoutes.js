const express = require('express');
const { getDatabaseStatus } = require('../config/db');

const router = express.Router();

/**
 * GET /api/health
 * Returns service status, uptime, environment, and accurate database connectivity
 */
router.get('/', (req, res) => {
  const dbStatus = getDatabaseStatus();

  res.status(200).json({
    status: 'ok',
    service: 'coursepilot-api',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbStatus.state,
      ready: dbStatus.isConnected,
    },
  });
});

module.exports = router;
