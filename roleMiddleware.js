const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Access restricted to ${roles.join(' or ')} role`,
      });
    }

    next();
  };
};

// Strict check: Only the designated Admin account can access Admin APIs
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const designatedAdminEmail = (process.env.ADMIN_EMAIL || 'admin@taskflow.com').toLowerCase().trim();

  if (req.user.role !== 'admin' || req.user.email.toLowerCase() !== designatedAdminEmail) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access restricted to the designated Admin account',
    });
  }

  next();
};

const requireEmployeeOrAdmin = requireRole('employee', 'admin');

module.exports = { requireRole, requireAdmin, requireEmployeeOrAdmin };