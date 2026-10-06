const { supabase } = require('../config/supabase');

/**
 * Middleware to verify Supabase JWT and attach userId to request
 * Expects: Authorization: Bearer <supabase_jwt>
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = user.id;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Authentication failed' });
  }
}

/**
 * Optional authentication - attaches userId if valid token provided,
 * but doesn't reject if missing/invalid (for public endpoints that can be enhanced with auth)
 */
async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (!error && user) {
      req.userId = user.id;
    }
  } catch (err) {
    // Silently ignore - optional auth
  }

  next();
}

module.exports = { authenticate, optionalAuth };