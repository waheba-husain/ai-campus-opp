require('dotenv').config();
const { supabase } = require('../config/supabase');

const DEVPOST_API_BASE = process.env.DEVPOST_API_BASE || 'https://devpost.com/api';

// Devpost hackathon themes that are student-relevant
const RELEVANT_THEMES = [
  'hackathon', 'student', 'university', 'college', 'campus', 'education',
  'ai', 'machine learning', 'data science', 'web', 'mobile', 'blockchain',
  'fintech', 'healthtech', 'edtech', 'sustainability', 'social good',
  'open source', 'developer tools', 'api', 'cloud', 'iot', 'robotics',
  'cybersecurity', 'ar', 'vr', 'gaming', 'creative coding'
];

// Keywords to exclude
const EXCLUDE_KEYWORDS = [
  'wedding', 'party', 'festival', 'concert', 'nightlife',
  'yoga', 'fitness', 'wellness', 'meditation', 'spiritual',
  'cooking', 'food', 'wine', 'beer', 'tasting', 'dinner',
  'dating', 'singles', 'kids', 'children', 'family', 'parenting',
  'real estate', 'property', 'investment', 'trading', 'forex',
  'gambling', 'casino', 'poker', 'sports betting'
];

function isStudentRelevant(hackathon) {
  const themes = (hackathon.themes || []).map(t => t.name?.toLowerCase() || '');
  const name = (hackathon.title || '').toLowerCase();
  const tagline = (hackathon.tagline || '').toLowerCase();
  const combined = `${name} ${tagline} ${themes.join(' ')}`;

  // Must NOT contain exclude keywords
  for (const kw of EXCLUDE_KEYWORDS) {
    if (combined.includes(kw)) return false;
  }

  // Must have at least one relevant theme OR contain student indicators
  const hasRelevantTheme = themes.some(t => RELEVANT_THEMES.some(rt => t.includes(rt)));
  const hasStudentIndicator = combined.includes('student') || combined.includes('university') || combined.includes('college') || combined.includes('campus');

  return hasRelevantTheme || hasStudentIndicator;
}

function mapDevpostToOpportunity(hackathon) {
  const endDateRaw = (hackathon.submission_period_dates || '').split('-').pop()?.trim();
  let deadline = null;
  if (endDateRaw) {
    const parsed = new Date(endDateRaw);
    if (!isNaN(parsed)) deadline = parsed.toISOString().split('T')[0];
  }

  // Extract skills from themes/tags
  const skillKeywords = [
    'react', 'vue', 'angular', 'javascript', 'typescript', 'python', 'java', 'c++', 'go', 'rust',
    'node', 'express', 'django', 'flask', 'spring', 'aws', 'azure', 'gcp', 'docker', 'kubernetes',
    'sql', 'postgresql', 'mongodb', 'redis', 'graphql', 'rest', 'html', 'css', 'tailwind',
    'machine learning', 'ml', 'ai', 'deep learning', 'nlp', 'computer vision', 'tensorflow', 'pytorch',
    'data science', 'pandas', 'numpy', 'tableau', 'power bi', 'figma', 'ui', 'ux', 'design',
    'blockchain', 'solidity', 'web3', 'smart contracts', 'cybersecurity', 'penetration testing'
  ];

  const themesText = (hackathon.themes || []).map(t => t.name).join(' ').toLowerCase();
  const foundSkills = skillKeywords.filter(skill => themesText.includes(skill.toLowerCase()));

  return {
    source: 'devpost',
    external_url: hackathon.url,
    title: hackathon.title,
    type: 'hackathon',
    deadline,
    eligibility: {
      openToAll: hackathon.open_state === 'open',
      studentOnly: themesText.includes('student') || themesText.includes('university'),
      location: hackathon.location || 'Online',
      isOnline: !hackathon.location || hackathon.location.toLowerCase().includes('online')
    },
    skills: foundSkills.slice(0, 10),
    tags: (hackathon.themes || []).map(t => t.name).slice(0, 5),
    description: hackathon.tagline || '',
    fetched_at: new Date().toISOString()
  };
}

async function fetchDevpostHackathons() {
  console.log('🔍 Fetching hackathons from Devpost...');

  try {
    const response = await fetch(`${DEVPOST_API_BASE}/hackathons?status[]=open&status[]=upcoming`);

    if (!response.ok) {
      throw new Error(`Devpost API error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    const hackathons = data.hackathons || [];

    console.log(`Fetched ${hackathons.length} hackathons from Devpost`);

    // Filter for student-relevant
    const relevant = hackathons.filter(isStudentRelevant);
    console.log(`→ ${relevant.length} relevant after filtering`);

    // Map and upsert
    let inserted = 0;
    let skipped = 0;

    for (const hackathon of relevant) {
      try {
        const opportunity = mapDevpostToOpportunity(hackathon);

        const { error } = await supabase
          .from('opportunities')
          .upsert(opportunity, { onConflict: 'external_url' })
          .select()
          .single();

        if (error) {
          console.error(`  ❌ ${opportunity.title}: ${error.message}`);
          skipped++;
        } else {
          inserted++;
          if (inserted % 10 === 0) {
            console.log(`  ✅ Processed ${inserted}/${relevant.length}...`);
          }
        }
      } catch (err) {
        console.error(`  ❌ Error processing ${hackathon.title}:`, err.message);
        skipped++;
      }
    }

    console.log(`\n✅ Done: ${inserted} inserted/updated, ${skipped} skipped`);
    return { inserted, skipped, total: relevant.length };
  } catch (err) {
    console.error('❌ Fatal error:', err.message);
    throw err;
  }
}

// Run if called directly
if (require.main === module) {
  fetchDevpostHackathons()
    .then(result => {
      console.log('\n📈 Summary:', result);
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ Fatal error:', err);
      process.exit(1);
    });
}

module.exports = { fetchDevpostHackathons, isStudentRelevant, mapDevpostToOpportunity };