const ApiError = require('../utils/ApiError');

/** Usage: router.get('/admin-only', authenticate, authorize('admin'), handler)
 * Must run after `authenticate`, which attaches req.user. */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized());
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(ApiError.forbidden(`Requires one of these roles: ${allowedRoles.join(', ')}`));
    }
    return next();
  };
}

module.exports = authorize;
