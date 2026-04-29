# StudyChaser Frontend

This is the React front end for StudyChaser — a regulatory training follow-up tracker for clinical research teams.

It currently runs off mock data in `src/data/mockData.js`. When you are ready, it can be wired to the backend API in `../Back end`.

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
/email       Email generator — pick study, training, person, and type to get a ready-to-copy email
```

## Email types

```text
first      First reminder
second     Second reminder
overdue    Overdue / escalation
confirm    Completion confirmation
pi         PI escalation
```

## Mock data

All data lives in `src/data/mockData.js` and includes three studies, six staff members, and five training items with realistic statuses.

## Connecting the backend

When you are ready to use live data instead of mock data, Claude Code can replace the imports from `src/data/mockData.js` with `fetch` calls to the backend API running at:

```text
http://127.0.0.1:4000
```

## Tech stack

```text
React 18
React Router v6
Vite 5
Plain CSS with CSS variables (no framework)
```
