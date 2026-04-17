const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token жок же формат туура эмес' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'Колдонуучу табылган жок' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token мөөнөтү бүттү' });
    }
    return res.status(401).json({ error: 'Token жараксыз' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Бул аракет үчүн укугуңуз жок' });
    }
    next();
  };
};

const parserAuth = (req, res, next) => {
  const token = req.headers['x-parser-token'];
  const secret = process.env.PARSER_SECRET || 'parser_internal_secret';
  if (!token || token !== secret) {
    return res.status(401).json({ error: 'Parser token жараксыз' });
  }
  next();
};

module.exports = { authMiddleware, requireRole, parserAuth };
