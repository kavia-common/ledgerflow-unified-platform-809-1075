'use strict';

const jwt = require('jsonwebtoken');

// PUBLIC_INTERFACE
/**
 * authMiddleware
 * Express middleware to validate Authorization Bearer JWT access tokens.
 * On success, attaches decoded token payload to req.user.
 * On failure, returns 401 Unauthorized.
 */
function authMiddleware(req, res, next) {
  try {
    const header = req.get('authorization') || req.get('Authorization');
    if (!header || !header.toLowerCase().startsWith('bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET, {
      issuer: 'ledgerflow-backend',
      audience: 'ledgerflow-clients',
    });
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

module.exports = {
  authMiddleware,
};
