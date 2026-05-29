# StudyChaser Backend

This is a dependency-free Node.js API for the StudyChaser frontend in `../frontend`.

It keeps the current synthetic demo data in `data/db.json` and exposes API routes for studies, people, trainings, dashboard summaries, training staff status updates, and email generation.

The hosted Cloudflare Worker is configured as a read-only portfolio demo. It allows public `GET` routes and `POST /api/email/generate`, but blocks data mutation routes. Local Node development keeps write routes available so the workflow can be exercised without changing the public demo.

## Run it

```bash
npm start
```

The API starts at:

```text
http://127.0.0.1:4000
```

## Cloudflare Workers

The backend can also run on Cloudflare Workers with Workers KV as its data store.

The deployed Worker is:

```text
https://studychaser-api.katalinalondono.workers.dev
```

Deploy it with:

```bash
npm run deploy
```

Run it locally with the Worker runtime:

```bash
npm run dev:worker
```

The Worker uses the `STUDYCHASER_KV` binding configured in `wrangler.toml`. On first request, it seeds KV from `data/db.json`.

`READ_ONLY_DEMO=true` in `wrangler.toml` blocks public data writes in the deployed Worker.

The `FRONTEND_ORIGINS` value controls which browser origins may call the API. It includes both `studychaser.katalinalondono.com` and `www.studychaser.katalinalondono.com`.

For live reload while developing:

```bash
npm run dev
```

## Deployed demo routes

```text
GET    /api/health
GET    /api/dashboard/summary
GET    /api/studies
GET    /api/people
GET    /api/trainings
GET    /api/trainings?studyId=1
POST   /api/email/generate
```

## Local development routes

```text
GET    /api/health
GET    /api/dashboard/summary

GET    /api/studies
POST   /api/studies
GET    /api/studies/:id
PATCH  /api/studies/:id
DELETE /api/studies/:id

GET    /api/people
POST   /api/people
GET    /api/people/:id
PATCH  /api/people/:id
DELETE /api/people/:id

GET    /api/trainings
GET    /api/trainings?studyId=1
POST   /api/trainings
GET    /api/trainings/:id
PATCH  /api/trainings/:id
DELETE /api/trainings/:id

PATCH  /api/trainings/:trainingId/staff/:personId
POST   /api/email/generate
```

## Example requests

Generate an email:

```bash
curl -s http://127.0.0.1:4000/api/email/generate \
  -H 'Content-Type: application/json' \
  -d '{"studyId":1,"trainingId":1,"personId":1,"type":"first","senderName":"Alex Demo"}'
```

Mark a staff training complete locally:

```bash
curl -s -X PATCH http://127.0.0.1:4000/api/trainings/1/staff/1 \
  -H 'Content-Type: application/json' \
  -d '{"status":"complete","daysAgo":null,"filedAt":"DEMO-ONC-001 > Training > Amendment 4"}'
```

## Connecting the frontend

The frontend API client lives in `../frontend/src/lib/api.js` and calls this API at `http://127.0.0.1:4000/api` during local development.

The backend already allows the Vite dev origin:

```text
http://localhost:5173
```

Change `FRONTEND_ORIGINS` in `.env` if your frontend runs somewhere else.

## Test it

```bash
npm test
```
