const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];


      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      if (req.user.isActive === false) {
        return res.status(403).json({ message: 'Account suspended by Admin' });
      }

      return next(); // ✅ FIX: return added

    } catch (error) {
      console.error("TOKEN ERROR:", error);
      return res.status(401).json({ message: 'Not authorized, token failed' }); // ✅ FIX
    }


  }

  // ✅ FIX: return added
  return res.status(401).json({ message: 'Not authorized, no token' });
};

const adminOnly = (req, res, next) => {
  if (req.user && req.user.role?.toLowerCase() === 'admin') {
    return next(); // ✅ FIX
  }

  return res.status(403).json({ message: 'Not authorized as admin' });
};

const verifiedOnly = (req, res, next) => {
  if (req.user && req.user.isVerified) {
    return next();
  }
  return res.status(403).json({ message: 'Account not verified by Admin yet. Action restricted.' });
};

module.exports = { protect, adminOnly, verifiedOnly };
