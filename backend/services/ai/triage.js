const { callGroq } = require('./groqClient');
const { supabase } = require('../../config/supabase');

const SYSTEM_PROMPT = `You are a deadline triage assistant for students. Given urgent opportunities (deadline ≤ 7 days), prioritize them by urgency, skill match, and impact.
Respond with ONLY a JSON object:
{
  "triage": [
    {
      "opportunityId": string,
      "title": string,
      "priority": number (1 = highest),
      "reason": string (why this priority: deadline urgency + skill match + impact)
    }
  ]
}`;

async function triageOpportunities(userId) {
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  // Get all opportunities
  const { data: opportunities, error: oppError } = await supabase
    .from('opportunities')
    .select('*');

  if (oppError) {
    throw new Error('Failed to fetch opportunities');
  }

  // Filter to urgent (≤7 days)
  const now = new Date();
  const urgent = (opportunities || [])
    .map(opp => {
      if (!opp.deadline) return null;
      const deadline = new Date(opp.deadline);
      const diffMs = deadline - now;
      const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      if (daysLeft < 0 || daysLeft > 7) return null;
      return { ...opp, daysLeft, urgency: daysLeft <= 3 ? 'urgent' : 'soon' };
    })
    .filter(Boolean);

  if (urgent.length === 0) {
    return { triage: [] };
  }

  const userPrompt = `Student Profile:
- Skills: ${JSON.stringify(profile.skills || [])}
- Interests: ${JSON.stringify(profile.interests || [])}

Urgent Opportunities (≤7 days):
${urgent.map((o, i) => `${i+1}. ${o.title} (${o.type}) - ${o.daysLeft} days left - Skills: ${JSON.stringify(o.skills || [])} - Tags: ${JSON.stringify(o.tags || [])}`).join('\n')}

Prioritize these by: 1) deadline urgency, 2) skill match, 3) potential impact. Return triage JSON.`;

  const result = await callGroq(SYSTEM_PROMPT, userPrompt, {
    required: ['triage']
  });

  return { triage: result.triage };
}

module.exports = { triageOpportunities };