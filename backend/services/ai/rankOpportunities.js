const { analyzeGap } = require('./gapAnalysis');
const { supabase } = require('../../config/supabase');

async function rankOpportunities(userId) {
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (profileError || !profile) {
    throw new Error('Profile not found. Extract one first.');
  }

  const { data: opportunities, error: oppError } = await supabase
    .from('opportunities')
    .select('*')
    .order('fetched_at', { ascending: false });
  if (oppError) {
    throw new Error('Failed to fetch opportunities');
  }
  if (!opportunities || opportunities.length === 0) {
    return { ranked: [] };
  }

  const now = new Date();
  const opportunitiesWithUrgency = opportunities.map(opp => {
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
    return { ...opp, daysLeft, urgency };
  });

  const oppIds = opportunitiesWithUrgency.map(o => o.id);
  const { data: existingMatches } = await supabase
    .from('opportunity_matches')
    .select('*')
    .eq('user_id', userId)
    .in('opportunity_id', oppIds);
  const matchByOppId = new Map((existingMatches || []).map(m => [m.opportunity_id, m]));

  const lookingFor = Array.isArray(profile.looking_for) ? profile.looking_for : [];

  // The cached score is pure skill fit. Preferences are applied here, on every read.
  function adjustScore(opp, rawScore) {
    let score = Number(rawScore) || 0;
    // Student picked types they want and this isn't one of them
    if (lookingFor.length > 0 && !lookingFor.includes(opp.type)) {
      score = score * 0.7;
    }
    // Deadline already passed
    if (opp.urgency === 'closed') {
      score = score * 0.3;
    }
    return Math.round(score);
  }

  // Build one full opportunity+score object the frontend can use directly
  function buildRankedItem(opp, score) {
    return {
      id: opp.id,
      opportunityId: opp.id,
      title: opp.title,
      organization: opp.organization,
      source: opp.source,
      type: opp.type,
      deadline: opp.deadline,
      summary: opp.description,
      eligibility: opp.eligibility,
      tags: opp.tags,
      urgency: opp.urgency,
      daysLeft: opp.daysLeft,
      score: adjustScore(opp, score.score),
      reason: score.reason,
      matched_skills: score.matched_skills || score.matchedSkills || [],
      missing_skills: score.missing_skills || score.missingSkills || [],
    };
  }

  const ranked = [];
  for (const opp of opportunitiesWithUrgency) {
    const cached = matchByOppId.get(opp.id);

    if (cached) {
      ranked.push(buildRankedItem(opp, cached));
      continue;
    }

    try {
      const gap = await analyzeGap(profile, opp);
      const matchData = {
        user_id: userId,
        opportunity_id: opp.id,
        score: gap.score,
        reason: gap.reason,
        matched_skills: gap.matchedSkills,
        missing_skills: gap.missingSkills,
        urgency: opp.urgency,
        days_left: opp.daysLeft,
      };
      await supabase
        .from('opportunity_matches')
        .upsert(matchData, { onConflict: 'user_id,opportunity_id' });

      ranked.push(buildRankedItem(opp, {
        score: gap.score,
        reason: gap.reason,
        matched_skills: gap.matchedSkills,
        missing_skills: gap.missingSkills,
      }));
    } catch (err) {
      console.error(`Gap analysis failed for opportunity ${opp.id}:`, err.message);
      ranked.push(buildRankedItem(opp, {
        score: 0,
        reason: 'Analysis failed',
        matched_skills: [],
        missing_skills: [],
      }));
    }
  }

  ranked.sort((a, b) => b.score - a.score);
  return { ranked };
}

module.exports = { rankOpportunities };