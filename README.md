# StudyChaser

StudyChaser is a regulatory training tracker for clinical study teams. It helps coordinators monitor protocol and amendment training, spot overdue acknowledgments, and generate follow-up emails for study staff.

## Project Structure

```text
frontend/   React and Vite web app
backend/    Node.js API for studies, people, trainings, dashboard summaries, and email generation
```

## What It Does

- Shows a dashboard of overdue, awaiting, completed, and active-study training counts.
- Lists active studies with PI, coordinator, sponsor, and IRB details.
- Tracks each training item by staff member, status, last contact date, and filing note.
- Shows staff-level outstanding and completed training counts.
- Generates ready-to-copy follow-up emails from backend templates.

## Run Locally

Start the backend API:

```bash
cd backend
npm start
```

The backend runs at:

```text
http://127.0.0.1:4000
```

Start the frontend app in a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend usually runs at:

```text
http://localhost:5173
```

If that port is busy, Vite will choose the next available local port.

## Backend API

The backend exposes endpoints for:

```text
GET  /api/health
GET  /api/dashboard/summary
GET  /api/studies
GET  /api/people
GET  /api/trainings
POST /api/email/generate
```

See `backend/README.md` for the full route list and example requests.

## Tech Stack

- React 18
- React Router
- Vite
- Node.js HTTP server
- JSON-backed local data store
- Plain CSS

## Status

The frontend is connected to the backend API for dashboard data, studies, people, trainings, and email generation.
