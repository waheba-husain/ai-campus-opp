const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse/lib/pdf-parse.js');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateExtractProfile, validateUpdateProfile } = require('../middleware/validate');
const { aiRateLimiter } = require('../middleware/rateLimit');
const { extractProfile } = require('../services/ai/extractProfile');
const { supabase } = require('../config/supabase');
const { invalidateMatches, profileChangeAffectsRanking, getAffectedOpportunityIds } = require('../services/ai/cache');

// PDF upload: kept in memory, never written to disk, max 5MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

// All profile routes require authentication
router.use(authenticate);

// POST /api/profile/extract - Extract profile from resume text (does NOT save)
router.post('/extract', aiRateLimiter, validateExtractProfile, async (req, res) => {
  try {
    const { resumeText } = req.body;

    const result = await extractProfile(resumeText);

    res.json({ profile: result.profile, extracted: result.extracted });
  } catch (err) {
    console.error('Profile extract error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/profile/extract-pdf - Extract profile from an uploaded PDF resume (does NOT save)
router.post(
  '/extract-pdf',
  aiRateLimiter,
  (req, res, next) => {
    upload.single('resume')(req, res, (err) => {
      if (err) {
        const msg = err.code === 'LIMIT_FILE_SIZE' ? 'PDF is too large (max 5MB)' : 'Upload failed';
        return res.status(400).json({ error: msg });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Real PDFs start with "%PDF"
      if (file.buffer.slice(0, 4).toString() !== '%PDF') {
        return res.status(400).json({ error: 'Please upload a PDF file' });
      }

      let text = '';
      try {
        const parsed = await pdfParse(file.buffer);
        text = (parsed.text || '').trim();
      } catch (parseErr) {
        console.error('PDF parse error:', parseErr);
        return res.status(422).json({ error: 'Could not read this PDF. Try pasting the text instead.' });
      }

      if (text.length < 30) {
        return res.status(422).json({
          error: 'No text found in this PDF (it may be a scanned image). Try pasting the text instead.',
        });
      }

      text = text.slice(0, 50000);

      const result = await extractProfile(text);

      res.json({ profile: result.profile, extracted: result.extracted, resumeText: text });
    } catch (err) {
      console.error('Profile PDF extract error:', err);
      res.status(500).json({ error: err.message || 'Internal server error' });
    }
  }
);

// GET /api/profile - Get current user's profile
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Profile not found. Extract one first.' });
      }
      console.error('Profile fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    res.json({ profile });
  } catch (err) {
    console.error('Profile fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/profile - Save profile (creates it if it doesn't exist yet)
router.put('/', validateUpdateProfile, async (req, res) => {
  try {
    const userId = req.userId;
    const { skills, interests, eligibility, looking_for } = req.body;

    // Current profile (may not exist yet for brand-new users)
    const { data: oldProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('skills, eligibility')
      .eq('id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Profile fetch error:', fetchError);
      return res.status(500).json({ error: 'Failed to fetch profile' });
    }

    const updateData = { id: userId, updated_at: new Date().toISOString() };
    if (skills !== undefined) updateData.skills = skills;
    if (interests !== undefined) updateData.interests = interests;
    if (eligibility !== undefined) updateData.eligibility = eligibility;
    if (looking_for !== undefined) updateData.looking_for = looking_for;

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert(updateData)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return res.status(500).json({ error: 'Failed to update profile' });
    }

    // Invalidate cache only if ranking-relevant fields (skills/eligibility) actually changed
    const affectsRanking = profileChangeAffectsRanking(oldProfile || {}, { skills, eligibility });
    if (affectsRanking) {
      const opportunityIds = await getAffectedOpportunityIds(userId, true);
      if (opportunityIds.length > 0) {
        await invalidateMatches(userId, opportunityIds);
        console.log(`Invalidated ${opportunityIds.length} cached matches for user ${userId}`);
      }
    }

    res.json({ profile });
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;