import { createServer } from 'node:http'
import { URL } from 'node:url'
import { buildDashboard } from './dashboard.js'
import { generateEmail } from './emailTemplates.js'
import { createStore, nextId, sanitizePerson, sanitizeStudy, sanitizeTraining } from './store.js'

const store = createStore()
const PORT = Number(process.env.PORT ?? 4000)
const HOST = process.env.HOST ?? '127.0.0.1'
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173'
const LOCAL_DEV_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/

const server = createServer(async (req, res) => {
  try {
    res.req = req
    await route(req, res)
  } catch (error) {
    sendJson(res, error.statusCode ?? 500, {
      error: error.statusCode ? error.message : 'Internal server error',
    })
  }
})

async function route(req, res) {
  if (req.method === 'OPTIONS') return sendEmpty(res, 204)

  const url = new URL(req.url, `http://${req.headers.host}`)
  const segments = url.pathname.split('/').filter(Boolean)

  if (segments[0] !== 'api') {
    return sendJson(res, 404, { error: 'Not found' })
  }

  if (req.method === 'GET' && segments[1] === 'health') {
    return sendJson(res, 200, { ok: true, service: 'studychaser-backend' })
  }

  const data = await store.read()

  if (req.method === 'GET' && segments[1] === 'dashboard' && segments[2] === 'summary') {
    return sendJson(res, 200, buildDashboard(data))
  }

  if (segments[1] === 'email' && segments[2] === 'generate' && req.method === 'POST') {
    const payload = await readJson(req)
    const study = data.studies.find((item) => item.id === Number(payload.studyId))
    const training = data.trainings.find((item) => item.id === Number(payload.trainingId))
    const person = data.people.find((item) => item.id === Number(payload.personId))

    if (!study || !training || !person) {
      return sendJson(res, 404, { error: 'Study, training, or person not found' })
    }

    return sendJson(res, 200, generateEmail({ study, training, person, ...payload }))
  }

  if (segments[1] === 'studies') {
    return handleCollection({
      req,
      res,
      data,
      collectionName: 'studies',
      id: segments[2],
      sanitize: sanitizeStudy,
      defaults: { status: 'active', activeTrainings: 0, completedTrainings: 0 },
    })
  }

  if (segments[1] === 'people') {
    return handleCollection({
      req,
      res,
      data,
      collectionName: 'people',
      id: segments[2],
      sanitize: sanitizePerson,
      defaults: { studyIds: [], missingTrainings: 0, completedTrainings: 0 },
    })
  }

  if (segments[1] === 'trainings') {
    if (segments[3] === 'staff' && segments[4]) {
      return handleStaffUpdate({ req, res, data, trainingId: segments[2], personId: segments[4] })
    }

    return handleCollection({
      req,
      res,
      data,
      collectionName: 'trainings',
      id: segments[2],
      sanitize: sanitizeTraining,
      defaults: { staff: [] },
      filter: (items) => {
        const studyId = new URL(req.url, `http://${req.headers.host}`).searchParams.get('studyId')
        return studyId ? items.filter((item) => item.studyId === Number(studyId)) : items
      },
    })
  }

  return sendJson(res, 404, { error: 'Not found' })
}

async function handleCollection({ req, res, data, collectionName, id, sanitize, defaults = {}, filter }) {
  const items = data[collectionName]

  if (req.method === 'GET' && !id) {
    return sendJson(res, 200, filter ? filter(items) : items)
  }

  if (req.method === 'GET' && id) {
    const item = items.find((candidate) => candidate.id === Number(id))
    return item ? sendJson(res, 200, item) : sendJson(res, 404, { error: 'Not found' })
  }

  if (req.method === 'POST' && !id) {
    const payload = sanitize(await readJson(req))
    const item = { id: nextId(items), ...defaults, ...payload }
    items.push(item)
    await store.write(data)
    return sendJson(res, 201, item)
  }

  if ((req.method === 'PATCH' || req.method === 'PUT') && id) {
    const index = items.findIndex((candidate) => candidate.id === Number(id))
    if (index === -1) return sendJson(res, 404, { error: 'Not found' })

    const payload = sanitize(await readJson(req))
    items[index] = req.method === 'PUT'
      ? { id: Number(id), ...defaults, ...payload }
      : { ...items[index], ...payload }

    await store.write(data)
    return sendJson(res, 200, items[index])
  }

  if (req.method === 'DELETE' && id) {
    const index = items.findIndex((candidate) => candidate.id === Number(id))
    if (index === -1) return sendJson(res, 404, { error: 'Not found' })

    const [deleted] = items.splice(index, 1)
    await store.write(data)
    return sendJson(res, 200, deleted)
  }

  return sendJson(res, 405, { error: 'Method not allowed' })
}

async function handleStaffUpdate({ req, res, data, trainingId, personId }) {
  if (req.method !== 'PATCH') return sendJson(res, 405, { error: 'Method not allowed' })

  const training = data.trainings.find((item) => item.id === Number(trainingId))
  if (!training) return sendJson(res, 404, { error: 'Training not found' })

  const index = training.staff.findIndex((member) => member.personId === Number(personId))
  if (index === -1) return sendJson(res, 404, { error: 'Training staff member not found' })

  const payload = await readJson(req)
  training.staff[index] = {
    ...training.staff[index],
    ...pick(payload, ['status', 'lastContacted', 'daysAgo', 'filedAt']),
  }

  await store.write(data)
  return sendJson(res, 200, training.staff[index])
}

async function readJson(req) {
  let body = ''
  for await (const chunk of req) body += chunk
  if (!body.trim()) return {}

  try {
    return JSON.parse(body)
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON'), { statusCode: 400 })
  }
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload)
  res.writeHead(statusCode, {
    ...corsHeaders(res.req),
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  })
  res.end(body)
}

function sendEmpty(res, statusCode) {
  res.writeHead(statusCode, corsHeaders(res.req))
  res.end()
}

function corsHeaders(req) {
  const origin = req?.headers.origin
  const allowedOrigin = origin && LOCAL_DEV_ORIGIN.test(origin) ? origin : FRONTEND_ORIGIN

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function pick(source, keys) {
  return keys.reduce((out, key) => {
    if (Object.hasOwn(source, key)) out[key] = source[key]
    return out
  }, {})
}

server.listen(PORT, HOST, () => {
  console.log(`StudyChaser API listening on http://${HOST}:${PORT}`)
})

export { server }
