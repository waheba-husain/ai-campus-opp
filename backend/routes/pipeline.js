const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { validateAddToPipeline, validateUpdatePipeline, validateUuidParam } = require('../middleware/validate');
const { generalRateLimiter } = require('../middleware/rateLimit');
const { supabase } = require('../config/supabase');

// All pipeline routes require authentication
router.use(authenticate);
router.use(generalRateLimiter);

// POST /api/pipeline - Add opportunity to pipeline
router.post('/', validateAddToPipeline, async (req, res) => {
  try {
    const userId = req.userId;
    const { opportunityId, status, notes } = req.body;

    // Verify opportunity exists
    const { data: opportunity, error: oppError } = await supabase
      .from('opportunities')
      .select('id, title')
      .eq('id', opportunityId)
      .single();

    if (oppError || !opportunity) {
      return res.status(404).json({ error: 'Opportunity not found' });
    }

    // Check if already in pipeline
    const { data: existing } = await supabase
      .from('pipeline')
      .select('id')
      .eq('user_id', userId)
      .eq('opportunity_id', opportunityId)
      .single();

    if (existing) {
      return res.status(409).json({ error: 'Opportunity already in pipeline' });
    }

    const { data: pipelineItem, error } = await supabase
      .from('pipeline')
      .insert({
        user_id: userId,
        opportunity_id: opportunityId,
        status: status || 'saved',
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Pipeline insert error:', error);
      return res.status(500).json({ error: 'Failed to add to pipeline' });
    }

    res.status(201).json({ pipelineItem });
  } catch (err) {
    console.error('Pipeline add error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/pipeline - List pipeline items
router.get('/', async (req, res) => {
  try {
    const userId = req.userId;
    const { status } = req.query;

    let query = supabase
      .from('pipeline')
      .select(`
        *,
        opportunity:opportunities (id, title, type, deadline, source, tags, eligibility, description)
      `)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: pipeline, error } = await query;

    if (error) {
      console.error('Pipeline fetch error:', error);
      return res.status(500).json({ error: 'Failed to fetch pipeline' });
    }

    res.json({ pipeline: pipeline || [] });
  } catch (err) {
    console.error('Pipeline fetch error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/pipeline/:id - Update pipeline item
router.patch('/:id', validateUuidParam, validateUpdatePipeline, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status, notes } = req.body;

    const updateData = { updated_at: new Date().toISOString() };
    if (status !== undefined) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data: pipelineItem, error } = await supabase
      .from('pipeline')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Pipeline update error:', error);
      return res.status(500).json({ error: 'Failed to update pipeline item' });
    }

    if (!pipelineItem) {
      return res.status(404).json({ error: 'Pipeline item not found' });
    }

    res.json({ pipelineItem });
  } catch (err) {
    console.error('Pipeline update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/pipeline/:id - Remove from pipeline
router.delete('/:id', validateUuidParam, async (req, res) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const { error } = await supabase
      .from('pipeline')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('Pipeline delete error:', error);
      return res.status(500).json({ error: 'Failed to remove from pipeline' });
    }

    res.json({ deleted: true, id });
  } catch (err) {
    console.error('Pipeline delete error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
