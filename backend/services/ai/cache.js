const { supabase } = require('../../config/supabase');

/**
 * Invalidate opportunity_matches cache.
 * - userId given: only that user's matches (optionally limited to opportunityIds)
 * - userId null + opportunityIds given: those opportunities' matches for ALL users
 * - both empty: does nothing (refuses to wipe the whole table)
 */
async function invalidateMatches(userId, opportunityIds = null) {
  const hasIds = Array.isArray(opportunityIds) && opportunityIds.length > 0;

  if (!userId && !hasIds) {
    return { invalidated: false };
  }

  let query = supabase.from('opportunity_matches').delete();

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (hasIds) {
    query = query.in('opportunity_id', opportunityIds);
  }

  const { error } = await query;

  if (error) {
    console.error('Cache invalidation error:', error);
    throw new Error('Failed to invalidate cache');
  }

  return { invalidated: true };
}

/**
 * Check if profile update actually changes ranking-relevant fields.
 * Only skills and eligibility affect ranking; interests don't.
 */
function profileChangeAffectsRanking(oldProfile, newData) {
  const relevantFields = ['skills', 'eligibility'];

  for (const field of relevantFields) {
    if (newData[field] !== undefined) {
      const oldVal = JSON.stringify(oldProfile[field] || []);
      const newVal = JSON.stringify(newData[field] || []);
      if (oldVal !== newVal) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get opportunity IDs that might be affected by a profile change.
 * Returns all opportunities if ranking fields changed, empty array otherwise.
 */
async function getAffectedOpportunityIds(userId, profileChangeAffectsRanking) {
  if (!profileChangeAffectsRanking) {
    return [];
  }

  // If ranking-relevant fields changed, we need to re-rank all opportunities for this user
  const { data: matches } = await supabase
    .from('opportunity_matches')
    .select('opportunity_id')
    .eq('user_id', userId);

  return (matches || []).map(m => m.opportunity_id);
}

module.exports = {
  invalidateMatches,
  profileChangeAffectsRanking,
  getAffectedOpportunityIds
};