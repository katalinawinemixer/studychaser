import seedData from '../data/db.json'
import { buildDashboard } from './dashboard.js'
import { generateEmail } from './emailTemplates.js'
import { nextId, pick, sanitizePerson, sanitizeStudy, sanitizeTraining } from './model.js'

const DATA_KEY = 'studychaser:data'
const LOCAL_DEV_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/

export default {
  async fetch(request, env) {
    try {
      return await route(request, env)
    } catch (error) {
      return json(request, env, error.statusCode ?? 500, {
        error: error.statusCode ? error.message : 'Internal server error',
      })
    }
  },
}

async function route(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders(request, env) })
  }

  const url = new URL(request.url)
  const segments = url.pathname.split('/').filter(Boolean)

  if (segments[0] !== 'api') {
    return json(request, env, 404, { error: 'Not found' })
  }

  if (request.method === 'GET' && segments[1] === 'health') {
    return json(request, env, 200, { ok: true, service: 'studychaser-backend-worker' })
  }

  const store = createWorkerStore(env)
  const data = await store.read()

  if (request.method === 'GET' && segments[1] === 'dashboard' && segments[2] === 'summary') {
    return json(request, env, 200, buildDashboard(data))
  }

  if (segments[1] === 'email' && segments[2] === 'generate' && request.method === 'POST') {
    const payload = await readJson(request)
    const study = data.studies.find((item) => item.id === Number(payload.studyId))
    const training = data.trainings.find((item) => item.id === Number(payload.trainingId))
    const person = data.people.find((item) => item.id === Number(payload.personId))

    if (!study || !training || !person) {
      return json(request, env, 404, { error: 'Study, training, or person not found' })
    }

    return json(request, env, 200, generateEmail({ study, training, person, ...payload }))
  }

  if (segments[1] === 'studies') {
    return handleCollection({
      request,
      env,
      store,
      data,
      collectionName: 'studies',
      id: segments[2],
      sanitize: sanitizeStudy,
      defaults: { status: 'active', activeTrainings: 0, completedTrainings: 0 },
    })
  }

  if (segments[1] === 'people') {
    return handleCollection({
      request,
      env,
      store,
      data,
      collectionName: 'people',
      id: segments[2],
      sanitize: sanitizePerson,
      defaults: { studyIds: [], missingTrainings: 0, completedTrainings: 0 },
    })
  }

  if (segments[1] === 'trainings') {
    if (segments[3] === 'staff' && segments[4]) {
      return handleStaffUpdate({ request, env, store, data, trainingId: segments[2], personId: segments[4] })
    }

    return handleCollection({
      request,
      env,
      store,
      data,
      collectionName: 'trainings',
      id: segments[2],
      sanitize: sanitizeTraining,
      defaults: { staff: [] },
      filter: (items) => {
        const studyId = new URL(request.url).searchParams.get('studyId')
        return studyId ? items.filter((item) => item.studyId === Number(studyId)) : items
      },
    })
  }

  return json(request, env, 404, { error: 'Not found' })
}

async function handleCollection({ request, env, store, data, collectionName, id, sanitize, defaults = {}, filter }) {
  const items = data[collectionName]

  if (request.method === 'GET' && !id) {
    return json(request, env, 200, filter ? filter(items) : items)
  }

  if (request.method === 'GET' && id) {
    const item = items.find((candidate) => candidate.id === Number(id))
    return item ? json(request, env, 200, item) : json(request, env, 404, { error: 'Not found' })
  }

  if (request.method === 'POST' && !id) {
    const payload = sanitize(await readJson(request))
    const item = { id: nextId(items), ...defaults, ...payload }
    items.push(item)
    await store.write(data)
    return json(request, env, 201, item)
  }

  if ((request.method === 'PATCH' || request.method === 'PUT') && id) {
    const index = items.findIndex((candidate) => candidate.id === Number(id))
    if (index === -1) return json(request, env, 404, { error: 'Not found' })

    const payload = sanitize(await readJson(request))
    items[index] = request.method === 'PUT'
      ? { id: Number(id), ...defaults, ...payload }
      : { ...items[index], ...payload }

    await store.write(data)
    return json(request, env, 200, items[index])
  }

  if (request.method === 'DELETE' && id) {
    const index = items.findIndex((candidate) => candidate.id === Number(id))
    if (index === -1) return json(request, env, 404, { error: 'Not found' })

    const [deleted] = items.splice(index, 1)
    await store.write(data)
    return json(request, env, 200, deleted)
  }

  return json(request, env, 405, { error: 'Method not allowed' })
}

async function handleStaffUpdate({ request, env, store, data, trainingId, personId }) {
  if (request.method !== 'PATCH') return json(request, env, 405, { error: 'Method not allowed' })

  const training = data.trainings.find((item) => item.id === Number(trainingId))
  if (!training) return json(request, env, 404, { error: 'Training not found' })

  const index = training.staff.findIndex((member) => member.personId === Number(personId))
  if (index === -1) return json(request, env, 404, { error: 'Training staff member not found' })

  const payload = await readJson(request)
  training.staff[index] = {
    ...training.staff[index],
    ...pick(payload, ['status', 'lastContacted', 'daysAgo', 'filedAt']),
  }

  await store.write(data)
  return json(request, env, 200, training.staff[index])
}

function createWorkerStore(env) {
  if (!env.STUDYCHASER_KV) {
    throw Object.assign(new Error('STUDYCHASER_KV binding is missing'), { statusCode: 500 })
  }

  return {
    async read() {
      const data = await env.STUDYCHASER_KV.get(DATA_KEY, 'json')
      if (data) return data

      const initialData = structuredClone(seedData)
      await this.write(initialData)
      return initialData
    },
    async write(data) {
      await env.STUDYCHASER_KV.put(DATA_KEY, JSON.stringify(data))
      return data
    },
  }
}

async function readJson(request) {
  const body = await request.text()
  if (!body.trim()) return {}

  try {
    return JSON.parse(body)
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON'), { statusCode: 400 })
  }
}

function json(request, env, status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders(request, env),
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin')
  const frontendOrigins = (env.FRONTEND_ORIGINS ?? env.FRONTEND_ORIGIN ?? 'https://studychaser.katalinalondono.com,https://www.studychaser.katalinalondono.com')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  const allowedOrigin = origin && (LOCAL_DEV_ORIGIN.test(origin) || frontendOrigins.includes(origin))
    ? origin
    : frontendOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}
