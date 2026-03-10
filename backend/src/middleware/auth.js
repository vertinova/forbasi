const jwt = require('jsonwebtoken');

// Verify JWT token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token tidak ditemukan' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      role_id: decoded.role_id,
      role: decoded.role,
      user_type: decoded.user_type // 'user', 'license_user', 'super_admin'
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ success: false, message: 'Token tidak valid' });
  }
};

// Role-based authorization
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    // Super admin always has access
    if (req.user.user_type === 'super_admin') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role_id)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }

    next();
  };
};

// Check specific user type
const authorizeUserType = (...types) => {
  return (req, res, next) => {
    if (!req.user || !types.includes(req.user.user_type)) {
      return res.status(403).json({ success: false, message: 'Akses ditolak' });
    }
    next();
  };
};

module.exports = { authenticate, authorize, authorizeUserType };
