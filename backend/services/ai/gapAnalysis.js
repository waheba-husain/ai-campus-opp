const { callGroq } = require('./groqClient');

const SYSTEM_PROMPT = `You are an expert at analyzing skill gaps between a student profile and an opportunity.
Given a student's profile and an opportunity, respond with ONLY a JSON object:
{
  "matchedSkills": string[] (skills the student has that match the opportunity),
  "missingSkills": string[] (skills the opportunity requires that the student lacks),
  "score": number (0-100, overall fit based on skill overlap, interest overlap and importance),
  "reason": string (1-2 sentence explanation of the score)
}
Rules:
- Only list a skill as matched if it is in the student's skills list. Never invent skills.
- If the opportunity's eligibility names a year or branch that the student does not meet, the score must be 30 or lower and the reason must say so.
- If the student's year or branch is unknown, do not penalise them for it.`;

async function analyzeGap(profile, opportunity) {
  const userPrompt = `Student Profile:
- Skills: ${JSON.stringify(profile.skills || [])}
- Interests: ${JSON.stringify(profile.interests || [])}
- Year and branch: ${JSON.stringify(profile.eligibility || {})}

Opportunity:
- Title: ${opportunity.title}
- Type: ${opportunity.type}
- Required Skills: ${JSON.stringify(opportunity.skills || [])}
- Tags: ${JSON.stringify(opportunity.tags || [])}
- Eligibility: ${JSON.stringify(opportunity.eligibility || {})}

Analyze the fit and return the JSON.`;

  return callGroq(SYSTEM_PROMPT, userPrompt, {
    required: ['matchedSkills', 'missingSkills', 'score', 'reason']
  });
}

module.exports = { analyzeGap };