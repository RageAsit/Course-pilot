const User = require('../models/user.model');
const { generateTokenAndSetCookie, clearTokenCookie } = require('../utils/generateToken');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

/**
 * Register a new student account
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    const { name, email, password } = validatedData;

    // Check for existing account
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'An account with this email address already exists.',
          status: 409,
        },
      });
    }

    // Create user in database (pre-save hook hashes password)
    const user = await User.create({
      name,
      email,
      password,
    });

    // Generate JWT and set HttpOnly cookie
    generateTokenAndSetCookie(res, user._id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: user.toJSON(),
    });
  } catch (error) {
    // Handle MongoDB duplicate key race condition
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          message: 'An account with this email address already exists.',
          status: 409,
        },
      });
    }
    next(error);
  }
};

/**
 * Log in student and issue session cookie
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    const { email, password } = validatedData;

    // Retrieve user including hashed password for verification
    const user = await User.findOne({ email }).select('+password');

    // Generic invalid-credentials message for security
    const invalidCredentialsResponse = () =>
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password.',
          status: 401,
        },
      });

    if (!user) {
      return invalidCredentialsResponse();
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return invalidCredentialsResponse();
    }

    // Set signed JWT HttpOnly cookie
    generateTokenAndSetCookie(res, user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully.',
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user.toJSON(),
  });
};

/**
 * Log out and clear session cookie
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  clearTokenCookie(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

module.exports = {
  register,
  login,
  getMe,
  logout,
};
