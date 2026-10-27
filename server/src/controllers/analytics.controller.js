const { getStudentAnalytics } = require('../services/analytics.service');

/**
 * Retrieve productivity analytics for the authenticated student
 * GET /api/analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await getStudentAnalytics(req.user._id);

    res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics,
};
