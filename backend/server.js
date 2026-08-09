require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = process.env.GROQ_API_KEY;
const MODEL = 'llama-3.3-70b-versatile';

async function callGroq(systemPrompt, userText) {
  if (!API_KEY) throw new Error('GROQ_API_KEY is not set in .env');
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText }
      ],
      response_format: { type: 'json_object' }
    })
  });
  if (!res.ok) throw new Error(`Groq API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const text = data.choices[0].message.content.trim();
  return JSON.parse(text.replace(/^```json\s*|```$/g, '').trim());
}

function calculateDaysLeft(dateStr) {
  if (!dateStr) return null;
  const endDate = new Date(dateStr);
  if (isNaN(endDate)) return null;
  const diffMs = endDate - new Date();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function urgencyLabel(daysLeft) {
  if (daysLeft === null) return null;
  if (daysLeft < 0) return 'closed';
  if (daysLeft <= 3) return 'urgent';
  if (daysLeft <= 7) return 'soon';
  return 'normal';
}

function withUrgency(opportunity) {
  const daysLeft = calculateDaysLeft(opportunity.deadline);
  return { ...opportunity, daysLeft, urgency: urgencyLabel(daysLeft) };
}

const seedOpportunities = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'seed.json'), 'utf-8'));

app.get('/api/opportunities', (req, res) => {
  res.json(seedOpportunities.map(withUrgency));
});

app.get('/api/live-hackathons', async (req, res) => {
  try {
    const response = await fetch('https://devpost.com/api/hackathons?status[]=open');
    if (!response.ok) throw new Error(`Devpost API error ${response.status}`);
    const data = await response.json();

    const mapped = data.hackathons.slice(0, 8).map((h, i) => {
      const endDateRaw = (h.submission_period_dates || '').split('-').pop().trim();
      return withUrgency({
        id: 'live-' + i,
        title: h.title,
        type: 'hackathon',
        organization: h.organization_name || 'Devpost',
        deadline: endDateRaw || null,
        eligibility: h.open_state === 'open' ? 'Open to all' : 'Check listing',
        tags: (h.themes || []).slice(0, 4).map(t => t.name),
        summary: h.tagline || 'Live hackathon currently open for registration.',
        source: 'Devpost (live)'
      });
    });

    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/extract', async (req, res) => {
  const { rawText } = req.body;
  if (!rawText || !rawText.trim()) return res.status(400).json({ error: 'rawText is required' });

  const systemPrompt = `You extract structured opportunity data from messy text (WhatsApp forwards, emails, social captions). Respond with ONLY a JSON object, no preamble, no markdown fences, with exactly these fields:
{"title": string, "type": "hackathon"|"internship"|"competition"|"scholarship"|"workshop"|"other", "organization": string, "deadline": string (format as YYYY-MM-DD if a date is mentioned or inferable, otherwise null), "eligibility": string, "tags": string[], "summary": string}`;

  try {
    const structured = await callGroq(systemPrompt, rawText);
    res.json(withUrgency(structured));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/match', async (req, res) => {
  const { profile, opportunities } = req.body;
  if (!profile || !opportunities) return res.status(400).json({ error: 'profile and opportunities are required' });

  const systemPrompt = `Rank opportunities for a student by relevance to their profile. Respond with ONLY a JSON object of this exact shape, no preamble, no markdown fences:
{"rankings": [{"id": string, "score": number, "reason": string}]}
Include every opportunity given, sorted by score descending, score from 0-100.`;

  const userText = `Student profile: ${profile}\n\nOpportunities:\n${JSON.stringify(opportunities, null, 2)}`;

  try {
    const result = await callGroq(systemPrompt, userText);
    res.json(result.rankings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));