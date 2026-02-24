const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

function authenticateToken(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: 'Access denied. Please login.' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
}

function isAdmin(req, res, next) {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Access denied. Admin only.' });
  }
  next();
}

module.exports = { authenticateToken, isAdmin, JWT_SECRET };
