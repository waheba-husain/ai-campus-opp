# REST API Specification: AI Campus Opp

**Base URL:** `https://ai-campus-opp.onrender.com/api`
**Auth:** Supabase-issued JWT, sent as `Authorization: Bearer <token>`. Frontend obtains this directly from Supabase Auth (not via this API). Endpoints marked **Public** skip this requirement.
**Format:** All requests/responses are JSON.

---

## 1. Extract Profile from Resume

`POST /api/profile/extract`

**Purpose:** Convert pasted resume text into a structured profile and save it for the authenticated user.
**Auth:** Required

**Request body:**
```json
{ "resumeText": "string, required" }
```

**Example request:**
```json
POST /api/profile/extract
Authorization: Bearer <token>
{ "resumeText": "B.Tech CSE 3rd year. Skills: React, Node.js, Python..." }
```

**Success response — 200:**
```json
{
  "profile": {
    "id": "a1b2c3d4-...",
    "skills": ["React", "Node.js", "Python"],
    "interests": ["AI/ML", "web dev"],
    "eligibility": { "year": "3rd", "branch": "CSE" }
  }
}
```

**Errors:**
| Status | Case |
|---|---|
| 400 | `resumeText` missing or empty |
| 401 | missing/invalid token |
| 502 | AI extraction failed / malformed model output |

---

## 2. Get Profile

`GET /api/profile`

**Purpose:** Fetch the current user's saved profile.
**Auth:** Required
**Params:** none

**Success response — 200:**
```json
{ "profile": { "id": "a1b2c3d4-...", "skills": [...], "interests": [...], "eligibility": {...} } }
```

**Errors:**
| Status | Case |
|---|---|
| 401 | missing/invalid token |
| 404 | no profile exists yet for this user |

---

## 3. Update Profile

`PUT /api/profile`

**Purpose:** Manually edit profile fields after auto-extraction.
**Auth:** Required

**Request body:**
```json
{
  "skills": ["string"],
  "interests": ["string"],
  "eligibility": { "year": "string", "branch": "string" }
}
```
All fields optional; only provided fields are updated.

**Success response — 200:**
```json
{ "profile": { "id": "a1b2c3d4-...", "skills": [...], "updated_at": "2026-08-16T12:00:00Z" } }
```

**Errors:**
| Status | Case |
|---|---|
| 400 | invalid field types |
| 401 | missing/invalid token |

---

## 4. Extract Opportunity from Pasted Text

`POST /api/opportunities/extract`

**Purpose:** Convert raw pasted listing text (e.g. from WhatsApp/Instagram) into a structured opportunity and store it as `source: "user-submitted"`.
**Auth:** Required

**Request body:**
```json
{ "rawText": "string, required" }
```

**Example request:**
```json
POST /api/opportunities/extract
Authorization: Bearer <token>
{ "rawText": "Join CodeFest 2026! Open to all years. Apply by Sept 20..." }
```

**Success response — 201:**
```json
{
  "opportunity": {
    "id": "b2c3d4e5-...",
    "source": "user-submitted",
    "title": "CodeFest 2026",
    "type": "hackathon",
    "deadline": "2026-09-20",
    "skills": ["Python", "Teamwork"],
    "tags": ["beginner-friendly"]
  }
}
```

**Errors:**
| Status | Case |
|---|---|
| 400 | `rawText` missing or too long (size limit) |
| 401 | missing/invalid token |
| 502 | AI extraction failed / malformed model output |

---

## 5. List Opportunities

`GET /api/opportunities`

**Purpose:** Return combined opportunities (live-fetched + seed + user-submitted).
**Auth:** Public

**Query params (all optional):**
| Param | Type | Purpose |
|---|---|---|
| `type` | string | filter by `hackathon`/`internship`/`competition`/`scholarship`/`workshop` |
| `source` | string | filter by `devpost`/`mlh`/`eventbrite`/`seed`/`user-submitted` |
| `urgency` | string | filter by `urgent`/`soon`/`normal`/`closed` |

**Example request:**
```
GET /api/opportunities?type=hackathon&urgency=urgent
```

**Success response — 200:**
```json
{
  "opportunities": [
    {
      "id": "b2c3d4e5-...",
      "source": "devpost",
      "title": "HackTheNorth 2026",
      "type": "hackathon",
      "deadline": "2026-09-15",
      "daysLeft": 5,
      "urgency": "urgent"
    }
  ]
}
```

**Errors:**
| Status | Case |
|---|---|
| 400 | invalid filter value |
| 502 | upstream source (Devpost/MLH) fetch failed |

---

## 6. Get Opportunity Detail

`GET /api/opportunities/:id`

**Purpose:** Fetch full detail for a single opportunity.
**Auth:** Public

**Path params:** `id` (uuid, required)

**Success response — 200:**
```json
{
  "opportunity": {
    "id": "b2c3d4e5-...",
    "title": "HackTheNorth 2026",
    "description": "...",
    "eligibility": {...},
    "skills": [...],
    "deadline": "2026-09-15",
    "external_url": "https://devpost.com/..."
  }
}
```

**Errors:**
| Status | Case |
|---|---|
| 404 | opportunity not found |

---

## 7. Get Ranked Opportunities (with Skill Gap)

`GET /api/opportunities/ranked`

**Purpose:** Return opportunities ranked against the current user's profile, each with a relevance score, reasoning, and matched/missing skills. Caches result in `opportunity_matches`.
**Auth:** Required

**Query params (optional):** same filters as endpoint 5 (`type`, `urgency`)

**Success response — 200:**
```json
{
  "ranked": [
    {
      "opportunityId": "b2c3d4e5-...",
      "title": "HackTheNorth 2026",
      "score": 82,
      "reason": "Strong fit due to JavaScript and API experience.",
      "matchedSkills": ["JavaScript", "APIs"],
      "missingSkills": ["Teamwork evidence"],
      "urgency": "urgent",
      "daysLeft": 5
    }
  ]
}
```

**Errors:**
| Status | Case |
|---|---|
| 401 | missing/invalid token |
| 404 | no profile found — must extract/create profile first |
| 502 | AI ranking failed / malformed model output |

---

## 8. Generate Prep Checklist

`GET /api/opportunities/:id/prep`

**Purpose:** Generate a prep checklist and registration steps for one opportunity, conditioned on that student's specific skill gap for it.
**Auth:** Required

**Path params:** `id` (uuid, required)

**Success response — 200:**
```json
{
  "prep": {
    "opportunityId": "b2c3d4e5-...",
    "registrationSteps": ["Create Devpost account", "Form a team of up to 4", "Submit by Sept 15"],
    "checklist": ["Build a demo covering API integration", "Add a teamwork example to your profile"]
  }
}
```

**Errors:**
| Status | Case |
|---|---|
| 401 | missing/invalid token |
| 404 | opportunity or profile not found |
| 502 | AI generation failed |

---

## 9. Get Deadline Triage

`GET /api/opportunities/triage`

**Purpose:** Reason across the user's currently urgent/relevant opportunities and return a suggested priority order.
**Auth:** Required

**Success response — 200:**
```json
{
  "triage": [
    { "opportunityId": "b2c3d4e5-...", "title": "HackTheNorth 2026", "priority": 1, "reason": "Highest relevance, least effort, closest deadline." },
    { "opportunityId": "c3d4e5f6-...", "title": "CodeFest 2026", "priority": 2, "reason": "High relevance but more prep required." }
  ]
}
```

**Errors:**
| Status | Case |
|---|---|
| 401 | missing/invalid token |
| 404 | no profile found |
| 502 | AI reasoning failed |

---

## 10. Add to Pipeline

`POST /api/pipeline`

**Purpose:** Save an opportunity to the user's tracked pipeline.
**Auth:** Required

**Request body:**
```json
{ "opportunityId": "uuid, required", "status": "saved | preparing | applied | result", "notes": "string, optional" }
```

**Success response — 201:**
```json
{ "pipelineItem": { "id": "d4e5f6g7-...", "opportunityId": "b2c3d4e5-...", "status": "saved" } }
```

**Errors:**
| Status | Case |
|---|---|
| 400 | missing `opportunityId` or invalid `status` value |
| 401 | missing/invalid token |
| 404 | opportunity not found |
| 409 | opportunity already in pipeline for this user |

---

## 11. List Pipeline

`GET /api/pipeline`

**Purpose:** Return the current user's full tracked pipeline.
**Auth:** Required
**Query params (optional):** `status` — filter by pipeline stage

**Success response — 200:**
```json
{
  "pipeline": [
    { "id": "d4e5f6g7-...", "opportunityId": "b2c3d4e5-...", "title": "HackTheNorth 2026", "status": "preparing", "updated_at": "2026-08-16T11:00:00Z" }
  ]
}
```

**Errors:**
| Status | Case |
|---|---|
| 401 | missing/invalid token |

---

## 12. Update Pipeline Item

`PATCH /api/pipeline/:id`

**Purpose:** Update status or notes for a tracked opportunity.
**Auth:** Required

**Path params:** `id` (uuid, required — pipeline row id)

**Request body:**
```json
{ "status": "saved | preparing | applied | result", "notes": "string, optional" }
```
At least one field required.

**Success response — 200:**
```json
{ "pipelineItem": { "id": "d4e5f6g7-...", "status": "applied", "updated_at": "2026-08-16T13:00:00Z" } }
```

**Errors:**
| Status | Case |
|---|---|
| 400 | no fields provided, or invalid `status` value |
| 401 | missing/invalid token |
| 403 | pipeline item does not belong to this user |
| 404 | pipeline item not found |

---

## 13. Remove from Pipeline

`DELETE /api/pipeline/:id`

**Purpose:** Remove a tracked opportunity from the pipeline.
**Auth:** Required

**Path params:** `id` (uuid, required)

**Success response — 200:**
```json
{ "deleted": true, "id": "d4e5f6g7-..." }
```

**Errors:**
| Status | Case |
|---|---|
| 401 | missing/invalid token |
| 403 | pipeline item does not belong to this user |
| 404 | pipeline item not found |

---

## Status Code Reference

| Code | Meaning |
|---|---|
| 200 | Success (read/update) |
| 201 | Resource created |
| 400 | Bad request — invalid/missing input |
| 401 | Unauthorized — missing/invalid Supabase token |
| 403 | Forbidden — resource belongs to another user |
| 404 | Not found |
| 409 | Conflict — duplicate resource |
| 502 | Upstream failure — AI provider or external API error |
