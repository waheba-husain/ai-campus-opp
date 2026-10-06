const { z } = require('zod');
const { callGroq } = require('./groqClient');
const { supabase } = require('../../config/supabase');

const TYPES = ['hackathon', 'internship', 'competition', 'scholarship', 'workshop', 'other'];

const SYSTEM_PROMPT = `You extract structured opportunity data from messy text (WhatsApp forwards, emails, social captions, flyers).
The text may contain ZERO, ONE, or MANY separate opportunities. Return one entry per distinct opportunity. Ignore chit-chat and anything that isn't an opportunity.
Respond with ONLY a JSON object, no preamble, no markdown fences:
{
  "opportunities": [
    {
      "title": string,
      "organization": string | null (who is hosting/offering),
      "type": "hackathon" | "internship" | "competition" | "scholarship" | "workshop" | "other",
      "deadline": string | null (YYYY-MM-DD; infer the year from today's date if missing),
      "eligibility": object (e.g. { "openToAll": true, "studentOnly": true, "minYear": "2nd" }),
      "skills": string[],
      "tags": string[],
      "summary": string (2-3 sentences),
      "url": string | null (only if a link for THIS opportunity is in the text),
      "raw_snippet": string (the original text for this opportunity, verbatim, max 600 chars)
    }
  ]
}
If there are no opportunities, return { "opportunities": [] }.`;

const candidateSchema = z.object({
  title: z.string().min(1),
  organization: z.string().nullable().optional().default(null),
  type: z.enum(TYPES).catch('other'),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().catch(null),
  eligibility: z.record(z.any()).catch({}),
  skills: z.array(z.string()).catch([]),
  tags: z.array(z.string()).catch([]),
  summary: z.string().catch(''),
  url: z.string().nullable().optional().default(null),
  raw_snippet: z.string().catch(''),
});

function normalize(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function makeDedupeKey({ title, deadline, url }) {
  if (url) return 'url:' + url.toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/[?#].*$/, '').replace(/\/$/, '');
  return `td:${normalize(title)}|${deadline || ''}`;
}

// Extract only. Saves nothing.
async function extractCandidates(rawText) {
  const today = new Date().toISOString().slice(0, 10);
  const userPrompt = `Today's date: ${today}\n\nRaw text:\n${rawText}\n\nExtract all opportunities as JSON.`;

  const out = await callGroq(SYSTEM_PROMPT, userPrompt, { required: ['opportunities'] });

  const list = Array.isArray(out.opportunities) ? out.opportunities : [];
  const candidates = [];
  for (const item of list) {
    const parsed = candidateSchema.safeParse(item);
    if (!parsed.success) continue; // skip malformed items, don't fail the whole batch
    const c = parsed.data;
    candidates.push({ ...c, dedupe_key: makeDedupeKey(c) });
  }

  // flag the ones already in the DB so the UI can show "already saved"
  const keys = candidates.map(c => c.dedupe_key);
  let existing = new Set();
  if (keys.length) {
    const { data } = await supabase.from('opportunities').select('dedupe_key').in('dedupe_key', keys);
    existing = new Set((data || []).map(r => r.dedupe_key));
  }
  return candidates.map(c => ({ ...c, alreadyExists: existing.has(c.dedupe_key) }));
}

// Save confirmed candidates. Duplicates are silently skipped.
async function saveCandidates(candidates) {
  const rows = candidates.map(c => ({
    source: 'user-submitted',
    title: c.title,
    organization: c.organization,
    type: c.type,
    deadline: c.deadline,
    eligibility: c.eligibility,
    skills: c.skills,
    tags: c.tags,
    description: c.summary,
    external_url: c.url,
    raw_text: c.raw_snippet,
    dedupe_key: c.dedupe_key || makeDedupeKey(c),
  }));

  const { data, error } = await supabase
    .from('opportunities')
    .upsert(rows, { onConflict: 'dedupe_key', ignoreDuplicates: true })
    .select();

  if (error) {
    console.error('Bulk save error:', error);
    throw new Error('Failed to save opportunities');
  }
  return { saved: data || [], skipped: rows.length - (data || []).length };
}

module.exports = { extractCandidates, saveCandidates };