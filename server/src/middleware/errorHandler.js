/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const isProduction = process.env.NODE_ENV === 'production';

  // Format Zod validation errors if present
  let formattedErrors = null;
  if (err.name === 'ZodError') {
    formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }

  // Format Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    formattedErrors = Object.keys(err.errors).map((key) => ({
      path: key,
      message: err.errors[key].message,
    }));
  }

  const response = {
    success: false,
    error: {
      message: err.message || 'Internal Server Error',
      status: statusCode,
      ...(formattedErrors ? { details: formattedErrors } : {}),
      ...(!isProduction && err.stack ? { stack: err.stack } : {}),
    },
  };

  if (!isProduction && statusCode === 500) {
    console.error(`[Error Handler] ${err.stack || err.message}`);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
