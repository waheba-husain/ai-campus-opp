const rateLimit = require('express-rate-limit');

/**
 * Rate limiters for different endpoint categories
 */

// Strict rate limiting for AI-heavy endpoints (expensive API calls)
const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: { error: 'Too many AI requests. Please wait before trying again.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Moderate rate limiting for data-fetching endpoints
const dataRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Lenient rate limiting for general API endpoints
const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute per IP
  message: { error: 'Too many requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  aiRateLimiter,
  dataRateLimiter,
  generalRateLimiter,
};