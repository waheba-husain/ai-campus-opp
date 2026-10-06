const { callGroq } = require('./groqClient');
const { supabase } = require('../../config/supabase');

const SYSTEM_PROMPT = `You are an expert at extracting structured opportunity data from messy text (WhatsApp forwards, emails, social captions, flyers).
Respond with ONLY a JSON object, no preamble, no markdown fences, with exactly these fields:
{
  "title": string,
  "type": "hackathon" | "internship" | "competition" | "scholarship" | "workshop" | "other",
  "deadline": string (format as YYYY-MM-DD if a date is mentioned or inferable, otherwise null),
  "eligibility": object (e.g., { "openToAll": true, "studentOnly": true, "minYear": "2nd" }),
  "skills": string[] (required or preferred skills),
  "tags": string[] (topics, themes, technologies),
  "summary": string (2-3 sentence summary)
}`;

async function extractOpportunity(rawText, userId) {
  const userPrompt = `Raw opportunity text:\n${rawText}\n\nExtract the opportunity as JSON.`;

  const extracted = await callGroq(SYSTEM_PROMPT, userPrompt, {
    required: ['title', 'type', 'eligibility', 'skills', 'tags', 'summary']
  });

  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .insert({
      source: 'user-submitted',
      title: extracted.title,
      type: extracted.type,
      deadline: extracted.deadline,
      eligibility: extracted.eligibility,
      skills: extracted.skills,
      tags: extracted.tags,
      raw_text: rawText,
    })
    .select()
    .single();

  if (error) {
    console.error('Opportunity insert error:', error);
    throw new Error('Failed to save opportunity');
  }

  return { opportunity, extracted };
}

module.exports = { extractOpportunity };