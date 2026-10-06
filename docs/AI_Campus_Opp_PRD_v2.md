# Product Requirements Document: AI Campus Opp

**Document owner:** Waheba
**Status:** Improved product concept (redesign for hackathon submission)
**Version:** 2.1
**Last updated:** August 2026 (revised: persistence tightened, second live source added to MVP, AI-visibility UI added)

---

## 1. Product Name

**AI Campus Opp**

---

## 2. One-Line Product Description

An AI platform that turns a student's resume into a living profile, matches it against scattered campus opportunities with visible skill-gap reasoning, and helps them triage, prepare for, and track applications before deadlines pass.

---

## 3. Problem Statement

Opportunity discovery for students is fragmented, overwhelming, and difficult to personalize. Students search across multiple platforms for hackathons, internships, competitions, and scholarships; listings are unstructured; deadlines are easy to miss; and students struggle to judge which opportunities are actually worth their limited time. The deeper problem is not just *finding* opportunities — it's making a confident decision, under time pressure, about which few opportunities out of many are worth pursuing, and what specifically to do to be competitive for them.

---

## 4. Target Users

| Segment | Description | Primary need |
|---|---|---|
| Underclassmen (1st/2nd year) | Broad explorers, unsure of eligibility | Discovery + eligibility clarity |
| Upperclassmen / job-seekers | Targeting specific roles/domains | Precision ranking, low noise |
| Niche-skill students | Specific technical/creative focus | Relevance in a sea of generic listings |
| Time-poor students | Juggling coursework + multiple deadlines | Fast triage, not just a longer list |

---

## 5. Goals

1. Remove manual effort from both **finding** and **understanding** opportunities.
2. Make personalization real — persistent, resume-derived, and explainable — not a disposable form filled out per session.
3. Help students make *decisions*, not just view rankings — especially when several deadlines compete for the same limited time.
4. Close the gap between "this is relevant to you" and "here's exactly what to do about it."
5. Give students a reason to come back — a place that tracks what they're actually pursuing, not just a one-time lookup tool.

---

## 6. User Pain Points

- Opportunities are scattered across WhatsApp, Instagram, LinkedIn, Unstop, Telegram, email, and college portals.
- Listings are unstructured and require manual reading to extract deadline, eligibility, and requirements.
- A ranked list doesn't explain *why* a score is what it is, or what's missing to improve it.
- When several relevant opportunities have close deadlines, students don't know which to prioritize.
- Preparation guidance is generic, not tied to the student's actual gaps.
- Building a profile manually is friction most students won't repeat or maintain.
- Once a student decides to apply somewhere, there's no continuity — nothing tracks progress or outcome.

---

## 7. Core Features

### Foundation (Current MVP — already built)
1. **AI Extraction** — unstructured text → structured opportunity object (title, type, deadline, eligibility, skills, tags).
2. **Live Opportunity Feed** — real-time Devpost API integration.
3. **AI Ranking** — opportunities scored against a student profile.
4. **Relevance Explanation** — natural-language reasoning per ranked result.
5. **Deadline Urgency Tags** — computed `daysLeft` and `urgency` tiers.
6. **Prep Guidance Generator** — registration steps + checklist per opportunity.
7. **Single-page Web Interface.**

### New — Improved MVP (highest priority additions)
8. **Resume-to-Profile Extraction** — student pastes/uploads resume text; the *same* extraction engine used for listings builds a structured, persistent profile (skills, experience, interests) automatically. Removes onboarding friction and reuses existing AI infrastructure rather than adding a new system.
9. **Skill-Gap Analysis** — for each ranked opportunity, the AI explicitly compares required skills/eligibility against the student's profile and surfaces what's matched vs. missing — not just a score.
10. **Gap-Driven Prep Checklists** — prep guidance is generated *from* the specific skill gap identified for that opportunity and student, not a generic template.
11. **Deadline Triage View** — when multiple relevant opportunities have overlapping or close deadlines, the AI reasons across the *set* (not one at a time) and suggests a priority order based on relevance score, effort required, and time remaining.
12. **Application Pipeline Tracker** — a simple Saved → Preparing → Applied → Result board so students have one place to track what they're actually pursuing, turning the tool into something they return to.
13. **Source Transparency Labeling** — UI clearly distinguishes live-sourced (Devpost) vs. seed/demo opportunities, to preserve trust in the deadline/eligibility data.
14. **Second Live Source** — a second live opportunity source (MLH or Eventbrite) is added so aggregation is credibly "multiple sources," not one.
15. **Visible AI Reasoning in UI** — raw pasted text shown alongside its structured result, and matched/missing skills shown as visible badges, so the AI's work is demonstrable, not just backend logic.

---

## 8. User Journeys / Use Cases

### Journey 1 — Fast Onboarding (New)
1. Student pastes resume text (no upload/parsing infra required — reuses extraction endpoint).
2. AI extracts skills, interests, and experience into a structured, persistent profile.
3. Student reviews/edits the auto-built profile in seconds instead of filling a form from scratch.

### Journey 2 — Discover, Rank, and Understand the Gap
1. Student opens the app; live Devpost feed + seed opportunities load, clearly labeled.
2. Opportunities are ranked against the stored profile.
3. Each result shows a score, a relevance explanation, and a skill-gap breakdown (matched vs. missing).

### Journey 3 — Structure a Manually Found Listing
1. Student pastes text from WhatsApp/Instagram/etc.
2. AI extracts it into the same structured format and folds it into the ranked list.

### Journey 4 — Triage Under Time Pressure (New)
1. Student has three relevant, urgent opportunities with close deadlines.
2. The triage view reasons across all three and suggests which to prioritize, given effort vs. relevance vs. time remaining.
3. Student makes a confident decision instead of guessing.

### Journey 5 — Prepare With Purpose (Improved)
1. Student selects an opportunity.
2. Checklist is generated specifically from that opportunity's identified skill gap for this student — not a generic list.

### Journey 6 — Track the Funnel (New)
1. Student marks an opportunity as Saved, then Preparing, then Applied.
2. Student later updates the Result.
3. The pipeline view gives a single place to see everything currently in motion.

---

## 9. Functional Requirements

| ID | Requirement |
|---|---|
| FR-1 | System shall extract structured opportunity data from raw unstructured text. |
| FR-2 | System shall fetch live opportunities from Devpost's public API. |
| FR-3 | System shall extract a structured student profile from pasted resume text, using the same extraction capability as FR-1. |
| FR-4 | System shall persist the student profile across sessions. |
| FR-5 | System shall rank opportunities against the stored profile and return a relevance score per opportunity. |
| FR-6 | System shall generate a natural-language relevance explanation per ranked opportunity. |
| FR-7 | System shall compute and display a skill-gap breakdown (matched vs. missing) per ranked opportunity. |
| FR-8 | System shall compute `daysLeft` and an `urgency` tier per opportunity. |
| FR-9 | System shall reason across a set of urgent/overlapping opportunities and return a suggested priority order. |
| FR-10 | System shall generate a prep checklist derived from the specific skill gap identified for a given student-opportunity pair. |
| FR-11 | System shall let a student set and update an application status (Saved/Preparing/Applied/Result) per opportunity. |
| FR-12 | System shall visually distinguish live-sourced opportunities from seed/demo opportunities in the UI. |
| FR-13 | System shall fetch live opportunities from a second public API (MLH or Eventbrite) in addition to Devpost. |
| FR-14 | System shall display the original raw text alongside its AI-structured result for extracted opportunities. |
| FR-15 | System shall display matched and missing skills as visible UI elements, not only in underlying data. |

---

## 10. Non-Functional Requirements

| ID | Requirement |
|---|---|
| NFR-1 | AI responses must be schema-validated; malformed output must not crash the UI. |
| NFR-2 | A first-time user should reach a populated, ranked view within seconds of pasting a resume — no multi-step form required. |
| NFR-3 | Profile and pipeline data must persist across sessions via real backend storage (Supabase) — browser-local storage alone is not sufficient. |
| NFR-4 | Backend cold-start delay (free-tier hosting) must be masked with a clear loading state. |
| NFR-5 | AI API keys remain server-side only. |
| NFR-6 | Frontend and backend remain independently deployable. |
| NFR-7 | Data source transparency (live vs. seed) must be visible, not implied. |

---

## 11. AI/ML Functionality

| Component | Detail |
|---|---|
| **Model** | Groq-hosted LLaMA 3.3 70B Versatile, OpenAI-compatible endpoint |
| **Extraction (listings)** | Free-text → structured opportunity schema |
| **Extraction (resume)** | Free-text resume → structured student profile schema — same engine, second application, not a new system |
| **Ranking** | Opportunity set + profile → scored, ordered list |
| **Skill-gap reasoning** | Structured comparison of profile skills vs. opportunity requirements → matched/missing breakdown, not just a score |
| **Cross-opportunity triage** | Multi-item reasoning over a set of urgent opportunities, weighing relevance, effort, and time remaining — genuinely different from single-item scoring |
| **Gap-driven prep generation** | Checklist generation conditioned on the specific identified gap, not a generic template |
| **Output control** | `response_format: json_object` enforced on all structured endpoints |
| **Known limitation** | Single AI provider (Groq), no fallback if unavailable; no learned personalization from user behavior yet (see Future Scope) |

---

## 12. Success Metrics

**Demonstrable in a hackathon demo:**
- End-to-end time from "paste resume" to "ranked list with skill gaps visible" (target: under 15 seconds).
- Number of reasoning steps a judge can visibly follow in one flow (resume → profile → rank → gap → checklist → pipeline).
- Correctness of skill-gap breakdown against a sample profile/opportunity pair.

**Post-hackathon / real usage:**
- 7-day return rate (pipeline tracker is the retention mechanism to validate).
- % of ranked opportunities a student saves or acts on.
- % reduction in self-reported missed deadlines.
- Number of live sources successfully integrated over time.

---

## 13. MVP Scope

### Current MVP (already built — foundation, unchanged)
- Listing extraction, Devpost live feed, ranking with reasoning, urgency tags, generic prep checklist, single-page UI.

### Improved MVP (build priority, in order of impact)
1. Resume-to-profile extraction (reuses existing extraction engine — highest impact, lowest new engineering cost).
2. Skill-gap analysis surfaced per ranked opportunity.
3. Gap-driven prep checklists (replaces generic checklist logic).
4. Application pipeline tracker (Saved/Preparing/Applied/Result).
5. Deadline triage view for clustered urgent opportunities.
6. Live vs. seed data labeling in the UI.
7. Second live opportunity source (MLH or Eventbrite), so aggregation spans multiple real sources.
8. Real backend persistence and authentication (Supabase), replacing any session-only state.
9. Visible AI-reasoning UI (raw-vs-structured view, matched/missing skill badges).

This ordering reflects impact and differentiation first, feasibility second. Items 1–6 reuse existing AI infrastructure with no new external integrations; items 7–9 were added after review to directly address the biggest gaps a judge would probe (source breadth, real persistence, visible AI work).

---

## 14. Future Scope (Ambitious but Realistic)

- Broader live-source aggregation beyond the second source now in MVP (additional public APIs, community/club submission flow).
- Notifications (email/push) for approaching deadlines and triage alerts.
- Learned personalization: ranking adjusts based on what a student actually saves, applies to, or skips over time.
- Browser extension or "share to AI Campus Opp" for one-tap capture of listings from any app.
- Admin/poster-facing side for clubs and career cells to submit opportunities directly.
- Outcome tracking and light analytics (e.g., which types of opportunities a student tends to win).

---

## 15. Out of Scope

- Full scraping of private/semi-private channels (WhatsApp groups, private Telegram) — not technically or legally reliable to build.
- Auto-apply or application submission on the student's behalf.
- A separate product surface for opportunity posters/companies (this version stays single-sided, student-facing).
- Payments or monetization.
- Native mobile app (web-only for this version).

---

## Appendix: What Changed and Why

The prior version of this product was a **single-shot classifier dressed as a platform**: paste text, get a score. The redesign keeps every working piece of that foundation but adds the layer that actually makes the AI valuable — reasoning *about* the student (skill gaps), reasoning *across* opportunities (triage), and giving the student somewhere to act on that reasoning (the pipeline). None of the additions require new external services or infrastructure; all six reuse the extraction and ranking engine already built, which is what makes this an *improvement* to the existing foundation rather than a rebuild.
