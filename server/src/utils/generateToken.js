const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT and attaches it to an HttpOnly cookie
 * @param {import('express').Response} res
 * @param {string|import('mongoose').Types.ObjectId} userId
 * @returns {string} The signed JWT
 */
const generateTokenAndSetCookie = (res, userId) => {
  const secret = process.env.JWT_SECRET || 'coursepilot_jwt_default_secret_key_32chars';
  const token = jwt.sign({ id: userId.toString() }, secret, {
    expiresIn: '7d',
  });

  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', token, {
    httpOnly: true, // Immune to JavaScript/XSS reading
    secure: isProduction, // HTTPS required in production
    sameSite: isProduction ? 'none' : 'lax', // Lax for local dev, None for cross-site prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: '/',
  });

  return token;
};

/**
 * Clears the authentication HttpOnly cookie
 * @param {import('express').Response} res
 */
const clearTokenCookie = (res) => {
  const isProduction = process.env.NODE_ENV === 'production';

  res.cookie('token', '', {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    expires: new Date(0), // Expire immediately
    path: '/',
  });
};

module.exports = {
  generateTokenAndSetCookie,
  clearTokenCookie,
};
