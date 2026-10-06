const express = require('express');
const router = express.Router();
const { authenticate, optionalAuth } = require('../middleware/auth');
const {
  validateExtractOpportunity,
  validateBulkSave,
  validateListOpportunities,
  validateUuidParam,
} = require('../middleware/validate');
const { dataRateLimiter, aiRateLimiter, generalRateLimiter } = require('../middleware/rateLimit');
const { supabase } = require('../config/supabase');
const { rankOpportunities } = require('../services/ai/rankOpportunities');
const { triageOpportunities } = require('../services/ai/triage');
const { extractOpportunity } = require('../services/ai/extractOpportunity');
const { extractCandidates, saveCandidates } = require('../services/ai/extractOpportunities');
const { generatePrepChecklist } = require('../services/ai/prepChecklist');
const { invalidateMatches } = require('../services/ai/cache');

// Public endpoints with optional auth
router.use(optionalAuth);
router.use(dataRateLimiter);

// GET /api/opportunities - List opportunities with filters
router.get('/', validateListOpportunities, async (req, res) => {
  try {
    const { type, source, urgency } = req.query;

    let query = supabase.from('opportunities').select('*');

    if (type) query = query.eq('type', type);
    if (source) query = query.eq('source', source);

    const { data: opportunities, error } = await query.order('fetched_at', { ascending: false });

    if (error) {
      console.error('Opportunities fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch opportunities' });
    }

    // Compute urgency for each opportunity
    const now = new Date();
    const withUrgency = (opportunities || []).map(opp => {
      let daysLeft = null;
      let urgency = 'normal';
      if (opp.deadline) {
        const deadline = new Date(opp.deadline);
        const diffMs = deadline - now;
        daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysLeft < 0) urgency = 'closed';
        else if (daysLeft <= 3) urgency = 'urgent';
        else if (daysLeft <= 7) urgency = 'soon';
      }
      if (urgency && req.query.urgency && req.query.urgency !== urgency) {
        return null; // filter out
      }
      return { ...opp, daysLeft, urgency };
    }).filter(Boolean);

    res.json({ opportunities: withUrgency });
  } catch (err) {
    console.error('Opportunities list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/opportunities/ranked - Ranked opportunities with skill gaps (requires auth)
router.get('/ranked', authenticate, validateListOpportunities, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await rankOpportunities(userId);

    // Apply urgency filter if requested
    let ranked = result.ranked;
    if (req.query.urgency) {
      ranked = ranked.filter(opp => opp.urgency === req.query.urgency);
    }

    res.json({ ranked });
  } catch (err) {
    console.error('Ranked opportunities error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/opportunities/triage - Deadline triage for urgent opportunities (requires auth)
router.get('/triage', authenticate, async (req, res) => {
  try {
    const userId = req.userId;

    const result = await triageOpportunities(userId);
    res.json({ triage: result.triage });
  } catch (err) {
    console.error('Triage error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/opportunities/:id - Get opportunity detail
router.get('/:id', validateUuidParam, async (req, res) => {
  try {
    const { id } = req.params;

    const { data: opportunity, error } = await supabase
      .from('opportunities')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    res.json({ opportunity });
  } catch (err) {
    console.error('Opportunity detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/opportunities/extract - Extract ONE opportunity from pasted text and save it (requires auth, AI rate limit)
router.post('/extract', authenticate, aiRateLimiter, validateExtractOpportunity, async (req, res) => {
  try {
    const { rawText } = req.body;
    const userId = req.userId;

    const result = await extractOpportunity(rawText, userId);

    // Invalidate cache for this new opportunity across all users who might match it
    await invalidateMatches(null, [result.opportunity.id]);

    res.status(201).json({ opportunity: result.opportunity, extracted: result.extracted });
  } catch (err) {
    console.error('Opportunity extract error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/opportunities/extract-bulk - Extract MANY opportunities from one paste (preview only, saves nothing)
router.post('/extract-bulk', authenticate, aiRateLimiter, validateExtractOpportunity, async (req, res) => {
  try {
    const candidates = await extractCandidates(req.body.rawText);
    res.json({ candidates });
  } catch (err) {
    console.error('Bulk extract error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/opportunities/bulk-save - Save the candidates the student confirmed (duplicates skipped)
router.post('/bulk-save', authenticate, generalRateLimiter, validateBulkSave, async (req, res) => {
  try {
    const { saved, skipped } = await saveCandidates(req.body.candidates);
    if (saved.length) await invalidateMatches(null, saved.map(o => o.id));
    res.status(201).json({ saved, skipped });
  } catch (err) {
    console.error('Bulk save error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// GET /api/opportunities/:id/prep - Generate gap-driven prep checklist (requires auth)
router.get('/:id/prep', authenticate, validateUuidParam, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const prep = await generatePrepChecklist(userId, id);

    res.json({ prep });
  } catch (err) {
    console.error('Prep error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

module.exports = router;