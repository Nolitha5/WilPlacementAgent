# WIL Placement Agent — Architecture

## Overview

AI-Powered Work-Integrated Learning (WIL) placement system that matches university students to workplace opportunities based on programme, skills, preferred location, and employer requirements.

**Stack:** React 18 · Vite · Tailwind CSS v3 · Supabase (Auth + DB + Storage)

---

## Folder Structure

```
WIL Placement Agent/
├── src/
│   ├── App.jsx                    ← Root component; session restore + page router
│   ├── main.jsx                   ← Vite entry point
│   ├── index.css                  ← Tailwind directives
│   │
│   ├── assets/                    ← Static assets (favicon, images)
│   │
│   ├── lib/
│   │   └── supabase.js            ← Supabase client (single instance)
│   │
│   ├── context/
│   │   └── AuthContext.jsx        ← React context for auth state (future: replace useState in App)
│   │
│   ├── hooks/
│   │   ├── useAuth.js             ← Auth hook (consumes AuthContext)
│   │   └── useToast.js            ← Toast notification hook
│   │
│   ├── services/                  ← All external API / Supabase calls
│   │   ├── ai.js                  ← OpenAI Chat Completions; Claude AI stub
│   │   ├── auth.js                ← signIn / signOut / restoreSession
│   │   ├── internships.js         ← Internship CRUD
│   │   ├── applications.js        ← Application CRUD
│   │   ├── employers.js           ← Employer CRUD
│   │   ├── students.js            ← Student CRUD
│   │   └── storage.js             ← CV upload → Supabase Storage
│   │
│   ├── utils/
│   │   ├── constants.js           ← STATUS, NAV_KEYS, THEME, curated data, seed articles
│   │   └── matchingEngine.js      ← skillMatch, runMatching, matchStudentToLive + mock data
│   │
│   ├── components/
│   │   ├── icons/
│   │   │   └── Icons.jsx          ← All SVG icons as the Ico object
│   │   ├── ui/
│   │   │   └── index.jsx          ← Barrel: Badge, StatCard, Modal, Toast, Spinner, MatchBar, PageHeader
│   │   └── layout/
│   │       └── Sidebar.jsx        ← Role-aware navigation sidebar
│   │
│   ├── layouts/
│   │   └── DashboardLayout.jsx    ← (future) Shared authenticated shell
│   │
│   └── pages/
│       ├── auth/
│       │   ├── LandingPage.jsx
│       │   ├── AdminLoginScreen.jsx
│       │   ├── EmployerLoginScreen.jsx
│       │   ├── StudentAuthScreen.jsx
│       │   └── AuthScreen.jsx     ← Role selector → correct login screen
│       ├── admin/
│       │   ├── AdminDashboard.jsx
│       │   ├── ManageEmployers.jsx
│       │   └── WILMatching.jsx
│       ├── student/
│       │   ├── StudentDashboard.jsx
│       │   ├── AvailableInternships.jsx
│       │   ├── MyApplications.jsx  ← includes "Opportunities You Qualify For"
│       │   ├── Opportunities.jsx   ← OpenAI live jobs + curated SA listings
│       │   └── CareerNews.jsx      ← OpenAI live news + seed articles
│       └── employer/
│           ├── EmployerDashboard.jsx
│           ├── AddInternship.jsx
│           ├── MyInternships.jsx
│           └── ViewApplicants.jsx  ← CV download, skills scan, interview scheduling
│
├── backend/                       ← Future Node/Express API server
│   ├── controllers/
│   ├── routes/
│   ├── services/
│   └── middleware/
│
├── database/
│   ├── schema/
│   │   └── tables.sql             ← Full Supabase schema (profiles, students, employers, internships, applications)
│   ├── migrations/
│   └── seed/
│       └── seed.sql               ← Example seed data for dev/staging
│
├── data/                          ← Mock CSV datasets
│   ├── students.csv
│   ├── employers.csv
│   ├── internships.csv
│   └── skills.csv
│
└── docs/
    └── ARCHITECTURE.md            ← This file
```

---

## Roles

| Role     | Theme   | Capabilities |
|----------|---------|--------------|
| Admin    | Slate   | Register employers, view platform stats, run WIL matching |
| Student  | Indigo  | Browse internships, apply with CV, view news & opportunities |
| Employer | Emerald | Post internships, review applicants, schedule interviews |

---

## Data Flow

```
Student registers / logs in
  → StudentDashboard (stats)
  → AvailableInternships (browse + apply with CV)
  → MyApplications (track + see matched opportunities)
  
 

Employer logs in (registered by Admin)
  → EmployerDashboard (stats)
  → AddInternship (post listing)
  → MyInternships (manage listings)
  → ViewApplicants (CV scan, schedule interview)

Admin logs in
  → AdminDashboard (system overview)
  → ManageEmployers (register employers)
  → WILMatching (AI-assisted matching, mock + live data)
```

---

## AI Integration

### Current: OpenAI (client-side)
- `src/services/ai.js` → `openAIWebSearch(prompt)`
- Model: `gpt-4o-mini` with `response_format: { type: "json_object" }`
- Used for: live SA job search, career news articles
- ⚠️ API key is client-side. Move calls to `backend/services/ai-server.js` before production.

### Planned: Claude AI Recommendation Engine
- Stub in `src/services/ai.js`
- Will use Anthropic Messages API to generate personalised placement recommendations
- Hook up via `backend/controllers/recommendations.js` + Supabase Edge Function

---

## Environment Variables

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_OPENAI_API_KEY=       # optional — enables live job search + news
```

---

## Key Design Decisions

- **Monolith → modules**: original `wil-placement-app.jsx` (~2400 lines) split into 30+ files with clear responsibilities.
- **Service layer**: all Supabase calls are in `src/services/` so components stay UI-only.
- **Constants extracted**: `CURATED_SA`, `SEED_ARTICLES`, `STATUS`, `NAV_KEYS`, colour maps all live in `utils/constants.js` — no JSX, importable anywhere.
- **Matching engine isolated**: `skillMatch`, `runMatching`, `matchStudentToLive` and all mock data are in `utils/matchingEngine.js`. Swap mock arrays for real Supabase queries when ready.
- **Barrel exports**: `components/ui/index.jsx` re-exports every shared UI primitive so imports stay short.
- **CV upload**: student uploads PDF → Supabase Storage `cvs` bucket → 10-year signed URL stored on application row → employer sees "Download CV" button.
