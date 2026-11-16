# Zinnov Growth Mindset & Resilience Inventory

Candidate self-assessment + HR panel workspace, built from
`Zinnov_Growth_Mindset_Resilience_Dynamic_Panel_Report_Example_Recalculated_9391.xlsx`.

- **Candidates** (`/`) enter name, email and phone (role/track optional), rate the 25 statements on the
  workbook's 1–5 scale, optionally add evidence per statement, review and submit. No login.
- **HR** (`/hr/`) sign in to see all submissions, open a candidate's panel insight report
  (overall weighted score, band, radar chart, construct score bars, interpretation and recommendation
  per behaviour, strongest / priority behaviour, recommended probes, all 25 responses), record panel
  notes, 1–5 panel ratings, recommendation, decision rationale and status, export the report as PDF,
  and export the candidate list as CSV.

Plain HTML, CSS and JavaScript (ES modules) — no framework, no build step. Two Vercel serverless
functions talk to a Neon Postgres database.

## Scoring

All scoring lives in [`public/assets/js/model.js`](public/assets/js/model.js) and is used by both the
browser and the API. It reproduces the workbook formulas:

| Workbook | Logic |
|---|---|
| `2 Self Assessment!H6:H10` | Behaviour score = average of its 5 ratings (`AVERAGEIF`) |
| `I6:I10`, `J6:J10`, `J12` | Weight 20% each; overall = Σ score × weight |
| `K6:K10`, `J14` | Band: `<1.8` Emerging, `<2.6` Developing, `<3.4` Consistent, `<4.2` Strong, else Exemplary; overall is "Incomplete" below 25 answers |
| `3 Panel Report!E11:F15` | Interpretation and recommendation text by score (`<2.6`, `<3.4`, `<4.2`, else) |
| `C19`, `C20` | Strongest / priority behaviour via `INDEX/MATCH` on max / min (first in sheet order on ties) |

Values are normalised to 15 significant digits before banding, as Excel does, so e.g. a mathematical
1.8 is "Developing" rather than falling to "Emerging" through floating-point error.

`npm test` checks the implementation against the values cached in the workbook.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000
```

Without `DATABASE_URL`, the dev server uses an embedded Postgres (PGlite) stored in `.data/` and
creates the HR login `hr@example.test` / `ChangeMe-Local-123`. Set `DATABASE_URL` to use Neon instead.

## Deploy to Vercel

1. Push this folder to a Git repository and import it in Vercel (Framework preset: **Other**; no build command).
2. In the project, open **Storage → Create Database → Neon** and connect it. This sets `DATABASE_URL`.
3. Add environment variables (see `.env.example`): `SESSION_SECRET`, `HR_ADMIN_EMAIL`, `HR_ADMIN_PASSWORD`, optionally `HR_ADMIN_NAME`.
4. Deploy. Tables are created automatically on the first request, along with the first HR account.

Add more HR users (or reset a password):

```bash
DATABASE_URL="postgresql://…" npm run create-hr -- priya@company.com "a-long-password" "Priya Sharma"
```

## Layout

```
api/
  submit.js         POST  candidate submission (validated, scored server-side)
  auth.js           GET session · POST sign in · DELETE sign out
  candidates.js     GET list / detail · PATCH panel review · DELETE  (HR only)
  _lib/             db (Neon / PGlite), auth (scrypt, signed cookie), http helpers
public/
  index.html        candidate assessment
  hr/               index (sign in), dashboard, report, framework
  assets/js/model.js   workbook content + scoring (shared)
scripts/            dev server, create-hr, scoring verification
```

## Security notes

- HR passwords are hashed with scrypt; sessions are HMAC-signed, `HttpOnly`, `SameSite=Strict` cookies (8 h).
- Five failed sign-ins for an email lock it for 15 minutes.
- Strict Content-Security-Policy (no inline script), `noindex` on HR pages, honeypot field on the candidate form.
