const Groq = require('groq-sdk');

const apiKey = process.env.GROQ_API_KEY;
const model = 'openai/gpt-oss-120b';

let client = null;
let mockMode = false;

function getClient() {
  if (!client && apiKey && !apiKey.includes('your_')) {
    client = new Groq({ apiKey });
    mockMode = false;
  } else if (!client) {
    mockMode = true;
    console.warn('⚠️ GROQ_API_KEY not set — AI services running in mock mode');
  }
  return client;
}

async function callGroq(systemPrompt, userPrompt, schema) {
  const groq = getClient();

  if (mockMode) {
    return getMockResponse(systemPrompt, schema);
  }

  try {
    const completion = await groq.chat.completions.create({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 2000,
    });

    const text = completion.choices[0]?.message?.content?.trim();
    if (!text) throw new Error('Empty response from Groq');

    const parsed = JSON.parse(text);
    return validateResponse(parsed, schema);
  } catch (err) {
    console.error('Groq API error:', err.message);
    throw new Error(`AI service error: ${err.message}`);
  }
}

function validateResponse(parsed, schema) {
  if (!schema) return parsed;

  const required = schema.required || [];
  for (const field of required) {
    if (!(field in parsed)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }
  return parsed;
}

function getMockResponse(systemPrompt, schema) {
  const lowerPrompt = systemPrompt.toLowerCase();

  if (lowerPrompt.includes('extract') && lowerPrompt.includes('profile')) {
    return {
      skills: ['React', 'Node.js', 'Python', 'SQL', 'TypeScript'],
      interests: ['AI/ML', 'web development', 'hackathons', 'open source'],
      eligibility: { year: '3rd', branch: 'CSE', gpa: '8.5' }
    };
  }

  if (lowerPrompt.includes('extract') && lowerPrompt.includes('opportunity')) {
    return {
      title: 'AI Campus Hackathon 2026',
      type: 'hackathon',
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      eligibility: { openToAll: true, studentOnly: true },
      skills: ['React', 'Python', 'AI/ML'],
      tags: ['hackathon', 'AI', 'campus'],
      summary: 'Build innovative AI solutions for campus problems'
    };
  }

  if (lowerPrompt.includes('rank') || lowerPrompt.includes('score')) {
    return {
      rankings: [
        { opportunityId: '1', score: 85, reason: 'Strong match on React and Python skills', matchedSkills: ['React', 'Python'], missingSkills: ['Docker'] },
        { opportunityId: '2', score: 72, reason: 'Good interest alignment, some skill gaps', matchedSkills: ['Python'], missingSkills: ['React', 'Kubernetes'] },
        { opportunityId: '3', score: 45, reason: 'Limited skill overlap', matchedSkills: ['SQL'], missingSkills: ['React', 'Python', 'ML'] }
      ]
    };
  }

  if (lowerPrompt.includes('triage')) {
    return {
      triage: [
        { opportunityId: '1', title: 'AI Campus Hackathon', priority: 1, reason: 'Deadline in 2 days, high skill match' },
        { opportunityId: '2', title: 'Summer Internship', priority: 2, reason: 'Deadline in 5 days, good alignment' }
      ]
    };
  }

  if (lowerPrompt.includes('prep') || lowerPrompt.includes('checklist')) {
    return {
      needsRegistration: true,
      registrationSteps: ['Create Devpost account', 'Form team of 3-4', 'Submit project proposal'],
      prepChecklist: ['Review hackathon themes', 'Set up repo and CI/CD', 'Prepare 3-min pitch deck', 'Practice demo'],
      timeline: 'Start immediately — 2 days until deadline'
    };
  }

  if (lowerPrompt.includes('gap') || lowerPrompt.includes('skill')) {
    return {
      matchedSkills: ['React', 'Python'],
      missingSkills: ['Docker', 'Kubernetes', 'MLOps'],
      score: 75
    };
  }

  return { result: 'mock response', note: 'No specific mock for this prompt type' };
}

module.exports = { callGroq, getClient };