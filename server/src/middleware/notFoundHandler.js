/**
 * 404 Handler for undefined API routes
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Resource not found: ${req.method} ${req.originalUrl}`,
      status: 404,
    },
  });
};

module.exports = notFoundHandler;
