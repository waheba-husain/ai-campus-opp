const { callGroq } = require('./groqClient');

const LOOKING_FOR_TYPES = ['hackathon', 'internship', 'competition', 'scholarship', 'workshop'];

const SYSTEM_PROMPT = `You are an expert at extracting structured student profiles from resume text.
Only include what is actually written in the text. Never invent skills or details.
Respond with ONLY a JSON object, no preamble, no markdown fences, with exactly these fields:
{
  "skills": string[] (technical skills, frameworks, languages, tools),
  "interests": string[] (domains, topics, areas of interest),
  "year": "1st" | "2nd" | "3rd" | "4th" | null (current year of study, null if unclear),
  "branch": string | null (e.g. "CSE", "ECE", null if unclear),
  "looking_for": array of any of "hackathon" | "internship" | "competition" | "scholarship" | "workshop" (only if the text says what they want, otherwise [])
}`;

// Extract only. Does NOT save anything. Saving happens via PUT /api/profile.
async function extractProfile(resumeText) {
  const userPrompt = `Resume text:\n${resumeText}\n\nExtract the profile as JSON.`;

  const raw = await callGroq(SYSTEM_PROMPT, userPrompt, {
    required: ['skills', 'interests', 'year', 'branch', 'looking_for']
  });

  const years = ['1st', '2nd', '3rd', '4th'];
  const extracted = {
    skills: Array.isArray(raw.skills) ? raw.skills : [],
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    eligibility: {
      year: years.includes(raw.year) ? raw.year : '',
      branch: typeof raw.branch === 'string' ? raw.branch : '',
    },
    looking_for: (Array.isArray(raw.looking_for) ? raw.looking_for : [])
      .filter(t => LOOKING_FOR_TYPES.includes(t)),
  };

  return { profile: extracted, extracted };
}

module.exports = { extractProfile };