const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

/**
 * Authentication Middleware
 * Validates JWT token from HttpOnly cookie or Authorization header,
 * resolves user from MongoDB, and attaches req.user.
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    // Check HttpOnly cookie first (primary mechanism)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      // Fallback: Authorization header
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Authentication required. Please log in.',
          status: 401,
        },
      });
    }

    const secret = process.env.JWT_SECRET || 'coursepilot_jwt_default_secret_key_32chars';

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: {
          message:
            err.name === 'TokenExpiredError'
              ? 'Session has expired. Please log in again.'
              : 'Invalid authentication token.',
          status: 401,
        },
      });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid session payload.',
          status: 401,
        },
      });
    }

    // Resolve user from MongoDB
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'User account no longer exists.',
          status: 401,
        },
      });
    }

    // Attach resolved, trusted user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;
