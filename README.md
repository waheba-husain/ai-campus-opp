# AI Campus Opp

**Intelligent opportunity discovery and application pipeline for college students.**

Students miss hackathons, competitions, scholarships, and workshops because they're scattered across Devpost, MLH, Eventbrite, university portals, and WhatsApp forwards. AI Campus Opp aggregates, extracts, and ranks opportunities by skill match — so students never miss a deadline again.

---

## Architecture

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│   React + Vite  │────▶│   Express.js API    │────▶│    Supabase     │
│   (Vercel)      │     │   (Render)          │     │  PostgreSQL +   │
│                 │     │                     │     │  Auth + RLS     │
└─────────────────┘     └──────────┬──────────┘     └─────────────────┘
                                   │
                          ┌────────▼────────┐
                          │   Groq API      │
                          │  LLM extraction │
                          │  + ranking      │
                          └─────────────────┘
```

**Flow:**
1. **Ingestion** — Devpost API fetches live hackathons; user-submitted text (WhatsApp forwards, emails) is pasted and extracted
2. **AI Extraction** — Groq LLM parses raw text → structured opportunity (title, deadline, skills, eligibility)
3. **Ranking** — For each user, skill-gap analysis scores opportunities 0-100, identifies matched/missing skills
4. **Pipeline** — Users save, prepare, apply, and track results through a Kanban-style board
5. **Triage** — Urgent deadlines (≤7 days) are surfaced with priority reasons

---

## Key Design Decisions

### Why reusing the extraction engine for both resumes and opportunities
Both resume parsing and opportunity text parsing share the same underlying task: extract structured data from messy, unstructured text. Rather than building two separate NLP pipelines, I designed a single `callGroq()` abstraction with different system prompts for each use case. This means future sources (MLH, university portals) only need a new prompt, not new infrastructure.

### Why RLS instead of application-level auth checks
Row Level Security (RLS) in Supabase enforces data isolation at the database layer. Every query automatically filters by `auth.uid()`, so even if a route handler is misconfigured, users can never read or write each other's profiles, matches, or pipeline items. This is defense-in-depth — the auth middleware handles JWT validation, but RLS is the final guard.

### Caching strategy (why no Redis)
`opportunity_matches` stores scored results per user+opportunity. When a user re-ranks, upserts overwrite the cache. This avoids repeated LLM calls without adding Redis/Bull infrastructure. For a single-user portfolio project, this is the right tradeoff — simple, fast, and free.

### Devpost as the sole live source
I evaluated MLH and Eventbrite as second sources:
- **MLH** — MyMLH API is OAuth-only for individual hackers; no public event listing/search endpoint exists
- **Eventbrite** — Their `/events/search/` endpoint was deprecated for public API keys in 2019; the `/events/` endpoint requires organizer-level tokens
- **Devpost** — Public, free, reliable API with structured hackathon data. No key required for basic access.

Rather than force broken integrations, I made a deliberate scope decision to stay with Devpost as the single authoritative source, with a clean architecture ready to plug in future sources if their APIs become available.

### Why Groq over OpenAI
Groq offers free-tier access to LLaMA models with fast inference. For a portfolio project, this means zero API costs during demos while still producing real AI-powered results. The `groqClient.js` abstraction makes it trivial to swap providers later.

---

## Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Frontend | React 18, Vite, Tailwind CSS | Fast dev, modern tooling, clean UI |
| Routing | React Router v6 | Standard for SPAs, nested layouts, protected routes |
| Auth | Supabase Auth (email/password) | Free tier, JWT-based, integrates with PostgreSQL |
| Database | Supabase PostgreSQL + RLS | Managed Postgres with built-in auth and row-level security |
| Backend | Express.js (Node 20) | Simple, well-documented, fast to build |
| AI | Groq API (LLaMA 3.3 70B) | Free tier, fast inference, no vendor lock-in |
| Validation | Zod | TypeScript-first schemas, reusable between frontend/backend |
| Rate Limiting | express-rate-limit | Tiered limits (AI: 10/min, data: 60/min, general: 120/min) |
| Data Source | Devpost API | Public, free, structured hackathon listings |
| Deployment | Render (backend), Vercel (frontend) | Free tiers, easy CI/CD from GitHub |

---

## Setup

### Prerequisites
- Node.js 20+
- Supabase account (free tier)
- Groq API key (free tier)
- Devpost API access (free, no key required)

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your keys
npm run dev
```

### Environment Variables

```env
GROQ_API_KEY=gsk_...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
CORS_ORIGIN=http://localhost:5173
PORT=3000
```

### Database Setup

1. Create a new Supabase project
2. Go to SQL Editor
3. Run `backend/migrations/001_initial_schema.sql`
4. Verify tables exist: `SELECT * FROM profiles; SELECT * FROM opportunities;`

### Fetch Live Data

```bash
npm run fetch:devpost    # Fetches current Devpost hackathons
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # Runs on http://localhost:5173
```

---

## What I'd Improve at Scale

1. **Redis caching + Bull queues** — Background job processing for AI ranking instead of synchronous request-time scoring; cache TTL with invalidation on profile/opportunity changes

2. **Multi-source ingestion** — Abstract fetcher interface so MLH/Eventbrite/custom university scrapers can be added without changing downstream logic

3. **Real-time notifications** — Supabase Realtime or websockets for deadline reminders, new matched opportunities, pipeline status changes

4. **AI-powered prep coaching** — Instead of generic checklists, generate personalized study plans based on skill gaps, time until deadline, and learning pace

5. **Team/collaboration features** — Shared pipelines for student teams applying to the same hackathons together

6. **Analytics dashboard** — Track application success rates, skill gap trends over time, opportunity market insights

7. **A/B testing on ranking** — Experiment with different skill-weighting algorithms to optimize for actual applications vs. just relevance scores

8. **Mobile app** — Native or PWA for deadline push notifications and on-the-go opportunity discovery
