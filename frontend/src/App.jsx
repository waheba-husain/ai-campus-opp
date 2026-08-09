import { useState, useEffect } from 'react';
import './App.css';

const API_BASE = 'https://ai-campus-opp.onrender.com';

function urgencyClass(urgency) {
  if (urgency === 'urgent') return 'badge urgent';
  if (urgency === 'soon') return 'badge soon';
  if (urgency === 'closed') return 'badge closed';
  return 'badge normal';
}

function urgencyText(daysLeft, urgency) {
  if (urgency === 'closed') return 'Closed';
  if (daysLeft === null || daysLeft === undefined) return 'No deadline';
  if (daysLeft < 0) return 'Closed';
  if (daysLeft === 0) return 'Last day!';
  return `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`;
}

function IconLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function IconSearch() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7" /><path d="M20 20l-3-3" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19V5" /><path d="M4 19h16" /><path d="M8 15V9" /><path d="M12 17V7" /><path d="M16 13v-2" />
    </svg>
  );
}

function PrepPlan({ plan }) {
  if (!plan) return null;
  return (
    <div className="prep-block">
      {plan.needsRegistration && (
        <>
          <p className="prep-label">Registration steps</p>
          <ul>{plan.registrationSteps?.map((s, i) => <li key={i}>{s}</li>)}</ul>
        </>
      )}
      <p className="prep-label">Prep checklist</p>
      <ul>{plan.prepChecklist?.map((s, i) => <li key={i}>{s}</li>)}</ul>
      <p className="prep-timeline">{plan.timeline}</p>
    </div>
  );
}

function OpportunityCard({ opp, score, onPrep, prepPlan, prepLoading }) {
  return (
    <article className="card">
      <div className="card-header">
        <div className="card-main">
          <h3>{opp.title}</h3>
          <p className="meta">{opp.organization} · via {opp.source || 'you'}</p>
        </div>
        {score && (
          <div className="match-badge" aria-label={`${score.score}% match`}>
            <span className="match-num">{score.score}</span>
            <span className="match-label">% match</span>
          </div>
        )}
      </div>

      <div className="card-badges">
        <span className="type-tag">{opp.type}</span>
        <span className={urgencyClass(opp.urgency)}>{urgencyText(opp.daysLeft, opp.urgency)}</span>
      </div>

      {opp.summary && <p className="summary">{opp.summary}</p>}
      {opp.eligibility && <p className="eligibility">Eligibility: {opp.eligibility}</p>}

      <div className="tags">
        {(opp.tags || []).map((t, i) => <span key={i} className="tag">{t}</span>)}
      </div>

      {score && (
        <div className="insight-block">
          <p className="insight-label">Why this matches you</p>
          <p className="insight-text">{score.reason}</p>
        </div>
      )}

      {!prepPlan && (
        <button className="prep-btn" onClick={onPrep} disabled={prepLoading}>
          {prepLoading ? 'Building prep plan…' : 'Help me prepare'}
        </button>
      )}
      <PrepPlan plan={prepPlan} />
    </article>
  );
}

function FeedMockup() {
  const items = [
    { title: 'Smart India Hackathon 2026', org: 'AICTE', type: 'hackathon', match: 94, urgency: 'urgent', days: '3 days left', insight: 'Strong fit for your CS background and hackathon interest.' },
    { title: 'Google Summer of Code 2026', org: 'Google', type: 'internship', match: 88, urgency: 'soon', days: '10 days left', insight: 'Matches your open-source and remote internship goals.' },
    { title: 'AI Case Study Competition', org: 'IIM Lucknow', type: 'competition', match: 76, urgency: 'normal', days: '21 days left', insight: 'Relevant if you want applied AI experience.' },
  ];
  return (
    <div className="mockup" aria-hidden="true">
      <div className="mockup-bar">
        <span className="status-dot" />
        <span className="mockup-label">AI Campus · Your Feed</span>
      </div>
      <div className="mockup-body">
        {items.map((item, i) => (
          <div key={i} className="mockup-card" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="mockup-card-header">
              <div>
                <p className="mockup-title">{item.title}</p>
                <p className="mockup-org">{item.org}</p>
              </div>
              <div className="mockup-match-badge">
                <span>{item.match}</span>
                <small>%</small>
              </div>
            </div>
            <div className="mockup-card-badges">
              <span className="type-tag">{item.type}</span>
              <span className={`badge ${item.urgency}`}>{item.days}</span>
            </div>
            <p className="mockup-insight">{item.insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="brand">
      <span className="status-dot" />
      <span className="brand-name">AI Campus</span>
    </div>
  );
}

function Landing({ onEnter }) {
  return (
    <div className="landing-page">
      <div className="ambient ambient-1" />
      <div className="ambient ambient-2" />

      <nav className="landing-nav">
        <Brand />
      </nav>

      <section className="hero">
        <div className="hero-content">
          <p className="hero-eyebrow">AI-powered opportunity discovery</p>
          <h1 className="hero-title">
            Never Miss an<br />
            <span className="hero-accent">Opportunity</span> Again.
          </h1>
          <p className="hero-sub">
            AI Campus discovers, understands and prioritizes hackathons, internships and
            competitions that actually match you.
          </p>
          <div className="hero-actions">
            <button className="btn btn-primary" onClick={onEnter}>Get Started →</button>
            <button className="btn btn-secondary" onClick={onEnter}>Explore Opportunities</button>
          </div>
        </div>
        <div className="hero-visual">
          <FeedMockup />
        </div>
      </section>

      <section className="features">
        <h2 className="section-title">Built for ambitious students</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><IconSearch /></div>
            <h3>Discover</h3>
            <p>Find opportunities from across the web — hackathons, internships, scholarships and more.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><IconUser /></div>
            <h3>Personalize</h3>
            <p>Tell AI about your goals and profile. It understands what matters to you.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><IconChart /></div>
            <h3>Prioritize</h3>
            <p>Get opportunities ranked for YOU — so you focus on what fits best.</p>
          </div>
        </div>
      </section>

      <section className="how-it-works">
        <h2 className="section-title">How it works</h2>
        <div className="steps">
          <div className="step">
            <span className="step-num">01</span>
            <div>
              <h3>Paste any announcement</h3>
              <p>Drop in a WhatsApp forward, email, or social post — AI structures it automatically.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">02</span>
            <div>
              <h3>Share your profile</h3>
              <p>Tell us your year, interests, and goals. AI ranks every opportunity by fit.</p>
            </div>
          </div>
          <div className="step">
            <span className="step-num">03</span>
            <div>
              <h3>Prep with confidence</h3>
              <p>Pick one and get a registration + prep checklist tailored to that opportunity.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="final-cta">
        <div className="final-cta-inner">
          <h2>Ready to find your next big opportunity?</h2>
          <p>Join students who never miss a deadline again.</p>
          <button className="btn btn-primary btn-lg" onClick={onEnter}>Get Started →</button>
        </div>
      </section>

      <footer className="landing-footer">
        <Brand />
        <span className="footer-tag">Built for campus builders</span>
      </footer>
    </div>
  );
}

export default function App() {
  const [entered, setEntered] = useState(false);
  const [opportunities, setOpportunities] = useState([]);
  const [rawText, setRawText] = useState('');
  const [profile, setProfile] = useState('');
  const [scores, setScores] = useState({});
  const [extractStatus, setExtractStatus] = useState('');
  const [matchStatus, setMatchStatus] = useState('');
  const [prepPlans, setPrepPlans] = useState({});
  const [prepLoadingId, setPrepLoadingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (entered) loadAll(); }, [entered]);

  async function loadAll() {
    setLoading(true);
    try {
      const [seedRes, liveRes] = await Promise.all([
        fetch(`${API_BASE}/api/opportunities`).then(r => r.json()),
        fetch(`${API_BASE}/api/live-hackathons`).then(r => r.json())
      ]);
      const live = Array.isArray(liveRes) ? liveRes : [];
      setOpportunities([...seedRes, ...live]);
    } catch (err) {
      setExtractStatus('Could not reach backend — is it running on port 3000?');
    } finally {
      setLoading(false);
    }
  }

  async function handleExtract() {
    if (!rawText.trim()) return;
    setExtractStatus('Extracting…');
    try {
      const res = await fetch(`${API_BASE}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      data.id = 'user-' + Date.now();
      data.source = 'Pasted by you';
      setOpportunities(prev => [data, ...prev]);
      setExtractStatus('Added to feed.');
      setRawText('');
    } catch (err) {
      setExtractStatus('Error: ' + err.message);
    }
  }

  async function handleMatch() {
    if (!profile.trim() || opportunities.length === 0) return;
    setMatchStatus('Ranking…');
    try {
      const res = await fetch(`${API_BASE}/api/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, opportunities })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const scoreMap = {};
      data.forEach(d => { scoreMap[d.id] = d; });
      setScores(scoreMap);
      setMatchStatus('Ranked.');
    } catch (err) {
      setMatchStatus('Error: ' + err.message);
    }
  }

  async function handlePrep(opp) {
    setPrepLoadingId(opp.id);
    try {
      const res = await fetch(`${API_BASE}/api/prep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opportunity: opp })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPrepPlans(prev => ({ ...prev, [opp.id]: data }));
    } catch (err) {
      alert('Could not build prep plan: ' + err.message);
    } finally {
      setPrepLoadingId(null);
    }
  }

  if (!entered) return <Landing onEnter={() => setEntered(true)} />;

  const sorted = [...opportunities].sort(
    (a, b) => (scores[b.id]?.score || 0) - (scores[a.id]?.score || 0)
  );

  const isRanking = matchStatus === 'Ranking…';
  const isExtracting = extractStatus === 'Extracting…';

  return (
    <div className="dashboard">
      <nav className="dash-nav">
        <Brand />
        <button className="nav-back" onClick={() => setEntered(false)}>← Home</button>
      </nav>

      <div className="dash-container">
        <header className="dash-header">
          <div>
            <p className="dash-eyebrow">Your dashboard</p>
            <h1>Find opportunities that fit you</h1>
            <p className="dash-sub">Paste announcements, set your profile, and let AI rank your feed.</p>
          </div>
          <div className="dash-stat">
            <span className="dash-stat-num">{opportunities.length}</span>
            <span className="dash-stat-label">in feed</span>
          </div>
        </header>

        <div className="dash-stack">
          <section className="panel">
            <h3 className="panel-title">1. Add an opportunity (paste raw text)</h3>
            <textarea
              value={rawText}
              onChange={e => setRawText(e.target.value)}
              placeholder='e.g. "Deadline extended for the AI hackathon on 21st march, open to all 2nd/3rd years..."'
            />
            <button className="btn btn-primary" onClick={handleExtract} disabled={isExtracting || !rawText.trim()}>
              {isExtracting ? 'Extracting…' : 'Extract & add to feed'}
            </button>
            <p className={`status ${extractStatus.startsWith('Error') ? 'status-error' : extractStatus === 'Added to feed.' ? 'status-success' : ''}`}>
              {extractStatus}
            </p>
          </section>

          <section className="panel">
            <h3 className="panel-title">2. Your profile</h3>
            <input
              value={profile}
              onChange={e => setProfile(e.target.value)}
              placeholder="e.g. 2nd year CS student, into AI/ML, looking for hackathons and internships"
            />
            <button
              className="btn btn-accent"
              onClick={handleMatch}
              disabled={isRanking || !profile.trim() || opportunities.length === 0}
            >
              {isRanking ? 'Ranking with AI…' : 'Rank feed for me'}
            </button>
            <p className={`status ${matchStatus.startsWith('Error') ? 'status-error' : matchStatus === 'Ranked.' ? 'status-success' : ''}`}>
              {matchStatus}
            </p>
          </section>
        </div>

        <section className="feed-section">
          <div className="feed-head">
            <h2 className="panel-title feed-title">Your feed</h2>
            {Object.keys(scores).length > 0 && (
              <span className="feed-badge">AI ranked</span>
            )}
          </div>

          {loading && (
            <div className="empty-state">
              <div className="spinner" />
              <p>Loading opportunities…</p>
            </div>
          )}

          {!loading && sorted.length === 0 && (
            <div className="empty-state">
              <p className="empty-title">No opportunities yet</p>
              <p className="empty-desc">Paste an announcement above or wait for live hackathons to load.</p>
            </div>
          )}

          {!loading && sorted.length > 0 && (
            <div className="feed-list">
              {sorted.map(opp => (
                <OpportunityCard
                  key={opp.id}
                  opp={opp}
                  score={scores[opp.id]}
                  onPrep={() => handlePrep(opp)}
                  prepPlan={prepPlans[opp.id]}
                  prepLoading={prepLoadingId === opp.id}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
