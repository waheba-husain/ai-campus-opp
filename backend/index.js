require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { generalRateLimiter } = require('./middleware/rateLimit');
const { supabase } = require('./config/supabase');

// Route imports
const profileRoutes = require('./routes/profile');
const opportunityRoutes = require('./routes/opportunities');
const pipelineRoutes = require('./routes/pipeline');

const app = express();

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || '*';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// General rate limiting
app.use(generalRateLimiter);

// Health check endpoint - liveness probe
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {}
  };

  // Check DB connectivity
  try {
    const start = Date.now();
    await supabase.from('opportunities').select('id').limit(1);
    health.checks.database = { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    health.status = 'degraded';
    health.checks.database = { status: 'error', message: err.message };
  }

  // Check Groq connectivity (if configured)
  if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_')) {
    try {
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      // Quick test with minimal token usage
      const start = Date.now();
      await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      });
      health.checks.groq = { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      health.status = 'degraded';
      health.checks.groq = { status: 'error', message: err.message };
    }
  } else {
    health.checks.groq = { status: 'skipped', message: 'GROQ_API_KEY not configured' };
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

// Debug Supabase connection
app.get('/debug-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').limit(1);
    res.json({ data, error: error ? error.message : null });
  } catch (err) {
    res.json({ crashed: true, message: err.message });
  }
});

// Readiness probe - full dependency check (DB + AI), for load balancers / orchestrators
app.get('/health/ready', async (req, res) => {
  const ready = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    dependencies: {}
  };

  // Database must be reachable for readiness
  try {
    const start = Date.now();
    const { data, error } = await supabase.from('opportunities').select('id').limit(1);
    if (error) throw error;
    ready.dependencies.database = { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    ready.status = 'degraded';
    ready.dependencies.database = { status: 'error', message: err.message };
  }

  // Groq readiness: warn (not fail) if unconfigured, error if configured but failing
  if (process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_')) {
    try {
      const Groq = require('groq-sdk');
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const start = Date.now();
      await groq.chat.completions.create({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: 'hi' }],
        max_tokens: 1,
      });
      ready.dependencies.groq = { status: 'ok', latencyMs: Date.now() - start };
    } catch (err) {
      // AI failing on a real key is a hard failure for ranking/extract endpoints
      ready.status = 'degraded';
      ready.dependencies.groq = { status: 'error', message: err.message };
    }
  } else {
    ready.dependencies.groq = { status: 'warn', message: 'GROQ_API_KEY not configured — AI endpoints degraded' };
  }

  const statusCode = ready.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(ready);
});

// API Routes
app.use('/api/profile', profileRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/pipeline', pipelineRoutes);

// 404 handler for unknown API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found', code: 'NOT_FOUND' });
});

// Structured error middleware - consistent { error, code, details } shape
// Any route can forward errors here via next(err); AI services throw with message + code.
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const code = err.code || (status >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR');

  if (status >= 500) {
    console.error(`[${code}] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(status).json({
    error: err.expose ? err.message : (status >= 500 ? 'Internal server error' : err.message),
    code,
    ...(err.details ? { details: err.details } : {}),
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 AI Campus Opp Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API base: http://localhost:${PORT}/api`);
});