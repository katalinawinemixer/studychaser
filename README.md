# StudyChaser

StudyChaser is a read-only portfolio demo of a regulatory training tracker for clinical study teams. It uses synthetic demo data to show how coordinators could monitor protocol and amendment training, spot overdue acknowledgments, and preview follow-up emails for study staff.

This public deployment is not production clinical or regulatory software. The hosted demo blocks data writes; local development can still exercise create, update, and delete routes.

## Project Structure

```text
frontend/   React and Vite web app, route views, API client, and production redirects
backend/    Node.js API, data store, tests, and Cloudflare Worker deployment config
```

## What It Does

- Shows a dashboard of overdue, awaiting, completed, and active-study training counts.
- Lists synthetic active studies with PI, coordinator, sponsor, and IRB details.
- Tracks each training item by staff member, status, last contact date, and filing note.
- Shows staff-level outstanding and completed training counts.
- Generates preview-only synthetic follow-up emails from backend templates.

## Run Locally

Start the backend API:

```bash
cd backend
npm install
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

The hosted Cloudflare Worker is read-only for portfolio review. Public demo routes are:

The backend exposes endpoints for:

```text
GET  /api/health
GET  /api/dashboard/summary
GET  /api/studies
GET  /api/people
GET  /api/trainings
POST /api/email/generate
```

Local development also includes write routes for experimenting with the workflow. See `backend/README.md` for the local route list and example requests.

## Verification

Run backend tests:

```bash
cd backend
npm test
```

Build the frontend:

```bash
cd frontend
npm run build
```

## Tech Stack

- React 18
- React Router
- Vite
- Node.js HTTP server
- JSON-backed local data store
- Plain CSS

## Status

The frontend is connected to the backend API for dashboard data, studies, people, trainings, and email generation. The production build is configured as a read-only synthetic demo. The API can run locally with Node or on Cloudflare Workers with KV-backed storage.
