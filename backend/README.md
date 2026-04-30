# StudyChaser Backend

This is a dependency-free Node.js API for the StudyChaser frontend in `../Front End`.

It keeps the current frontend mock data in `data/db.json` and exposes API routes for studies, people, trainings, dashboard summaries, training staff status updates, and email generation.

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

For live reload while developing:

```bash
npm run dev
```

## Key routes

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
  -d '{"studyId":1,"trainingId":1,"personId":1,"type":"first","senderName":"Katalina M."}'
```

Mark a staff training complete:

```bash
curl -s -X PATCH http://127.0.0.1:4000/api/trainings/1/staff/1 \
  -H 'Content-Type: application/json' \
  -d '{"status":"complete","daysAgo":null,"filedAt":"ABC-2024-001 > Training > Amendment 4"}'
```

## Connecting the frontend

I did not modify the frontend folder. When you are ready, Claude Code can swap the frontend imports from `src/data/mockData.js` to `fetch` calls against these endpoints.

The backend already allows the Vite dev origin:

```text
http://localhost:5173
```

Change `FRONTEND_ORIGIN` in `.env` if your frontend runs somewhere else.

## Test it

```bash
npm test
```
