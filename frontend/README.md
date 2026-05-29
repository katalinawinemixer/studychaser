# StudyChaser Frontend

This is the React frontend for StudyChaser, a read-only portfolio demo of a regulatory training follow-up tracker for clinical research teams.

The app is wired through `src/lib/api.js`. In local development it calls the backend API at `http://127.0.0.1:4000/api`. In production, `VITE_API_BASE_URL` points to the deployed API and `VITE_READ_ONLY_DEMO=true` hides write controls.

All production data is synthetic demo data. The hosted app is not production clinical or regulatory software.

## Run it

```bash
npm install
npm run dev
```

The app starts at:

```text
http://localhost:5173
```

## Screens

```text
/dashboard   Overview — overdue count, awaiting response, stat cards, needs-attention table
/studies     Card grid of all active studies with PI, coordinator, sponsor, and IRB
/training    Per-study training items with per-person status, days since contact, and filing notes
/people      Staff directory with outstanding and completed training counts
/email       Email generator — pick study, training, person, and type to preview a synthetic email
```

## Email types

```text
first      First reminder
second     Second reminder
overdue    Overdue / escalation
confirm    Completion confirmation
pi         PI escalation
```

## API Configuration

Local backend:

```text
http://127.0.0.1:4000
```

Production builds can use:

```bash
VITE_API_BASE_URL=https://studychaser-api.katalinalondono.workers.dev/api
VITE_READ_ONLY_DEMO=true
```

`src/data/mockData.js` still provides local fallback data when the app is running on localhost and the local backend is not available.

## Verify it

```bash
npm run build
```

## Tech stack

```text
React 18
React Router v6
Vite 5
Plain CSS with CSS variables (no framework)
```
