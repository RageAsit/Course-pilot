/**
 * Centralized error handling middleware
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  const isProduction = process.env.NODE_ENV === 'production';

  // Format Zod validation errors if present
  let formattedErrors = null;
  if (err.name === 'ZodError') {
    statusCode = 400;
    formattedErrors = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
  }

  // Format Mongoose validation errors
  if (err.name === 'ValidationError' && err.errors) {
    statusCode = 400;
    formattedErrors = Object.keys(err.errors).map((key) => ({
      path: key,
      message: err.errors[key].message,
    }));
  }

  // Format Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
  }

  const errorMessage =
    err.name === 'ZodError' && formattedErrors && formattedErrors.length > 0
      ? formattedErrors[0].message
      : err.message || 'Internal Server Error';

  const response = {
    success: false,
    error: {
      message: errorMessage,
      status: statusCode,
      ...(formattedErrors ? { details: formattedErrors } : {}),
      ...(!isProduction && err.stack && statusCode === 500 ? { stack: err.stack } : {}),
    },
  };

  if (!isProduction && statusCode === 500) {
    console.error(`[Error Handler] ${err.stack || err.message}`);
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
