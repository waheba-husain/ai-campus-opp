const { callGroq } = require('./groqClient');
const { supabase } = require('../../config/supabase');

const SYSTEM_PROMPT = `You are a prep coach for students applying to hackathons, internships, competitions, scholarships, and workshops.
Given a student profile and an opportunity, generate a practical preparation plan.
Respond with ONLY a JSON object, no preamble, no markdown fences:
{
  "needsRegistration": boolean,
  "registrationSteps": string[] (2-4 short actionable steps, e.g., "Create Devpost account", "Form team of 3-4", "Submit project proposal by [date]"),
  "prepChecklist": string[] (4-6 short actionable items specific to this opportunity's type, theme, and the student's skill gaps),
  "timeline": string (one short sentence suggesting how to pace prep given the deadline)
}`;

async function generatePrepChecklist(userId, opportunityId) {
  // Get user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (profileError || !profile) {
    throw new Error('Profile not found');
  }

  // Get opportunity
  const { data: opportunity, error: oppError } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', opportunityId)
    .single();

  if (oppError || !opportunity) {
    throw new Error('Opportunity not found');
  }

  // Get gap analysis if cached
  const { data: match } = await supabase
    .from('opportunity_matches')
    .select('matched_skills, missing_skills')
    .eq('user_id', userId)
    .eq('opportunity_id', opportunityId)
    .single();

  const missingSkills = match?.missing_skills || [];
  const matchedSkills = match?.matched_skills || [];

  const userPrompt = `Student Profile:
- Skills: ${JSON.stringify(profile.skills || [])}
- Interests: ${JSON.stringify(profile.interests || [])}
- Matched Skills for this opportunity: ${JSON.stringify(matchedSkills)}
- Missing Skills: ${JSON.stringify(missingSkills)}

Opportunity:
- Title: ${opportunity.title}
- Type: ${opportunity.type}
- Deadline: ${opportunity.deadline || 'Not specified'}
- Required Skills: ${JSON.stringify(opportunity.skills || [])}
- Tags: ${JSON.stringify(opportunity.tags || [])}
- Summary: ${opportunity.summary || opportunity.description || 'Not provided'}
- Eligibility: ${JSON.stringify(opportunity.eligibility || {})}

Generate a practical prep checklist and registration steps.`;

  return callGroq(SYSTEM_PROMPT, userPrompt, {
    required: ['needsRegistration', 'registrationSteps', 'prepChecklist', 'timeline']
  });
}

module.exports = { generatePrepChecklist };