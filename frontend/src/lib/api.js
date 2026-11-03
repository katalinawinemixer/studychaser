import { generateEmail } from '../../../backend/src/emailTemplates'
import { buildDashboard as dashboardSummary } from '../../../backend/src/dashboard'
import { useEffect, useState } from 'react'
import seedData from '../data/mockData'
import { workspaceView } from '../../../shared/workspace'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000/api'
const LOCAL_API_BASE_URL = 'http://127.0.0.1:4000/api'
export const IS_READ_ONLY_DEMO = import.meta.env.VITE_READ_ONLY_DEMO === 'true'

export async function apiGet(path) {
  return apiRequest(path)
}

export async function apiPost(path, body) {
  return apiRequest(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function apiPatch(path, body) {
  return apiRequest(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function useApiData(loader, initialData) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let active = true

    setLoading(true)
    setError('')

    Promise.resolve()
      .then(loader)
      .then(result => {
        if (active) setData(result)
      })
      .catch(err => {
        if (active) setError(err.message || 'Unable to load data')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [reloadKey])

  const refetch = () => setReloadKey(k => k + 1)

  return { data, loading, error, refetch }
}

async function apiRequest(path, options) {
  if (shouldUseFallbackApi()) {
    return fallbackRequest(path, options)
  }

  try {
    return await request(path, options)
  } catch (error) {
    if (canFallback(path, options) && (!error.status || error.status >= 500)) {
      return fallbackRequest(path, options)
    }

    throw error
  }
}

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw Object.assign(new Error(data?.error ?? `Request failed with ${response.status}`), { status: response.status })
  }

  return data
}

function shouldUseFallbackApi() {
  if (import.meta.env.VITE_API_BASE_URL || API_BASE_URL !== LOCAL_API_BASE_URL) {
    return false
  }

  if (typeof window === 'undefined') {
    return false
  }

  return !['localhost', '127.0.0.1'].includes(window.location.hostname)
}

function canFallback(path, options) {
  const method = options?.method ?? 'GET'
  return method === 'GET' || (method === 'POST' && path === '/email/generate')
}

async function fallbackRequest(path, options) {
  const { people, studies, trainings } = workspaceView(seedData)
  const method = options?.method ?? 'GET'
  const url = new URL(path, 'http://studychaser.local')

  if (method === 'GET' && url.pathname === '/studies') return studies
  if (method === 'GET' && url.pathname === '/people') return people
  if (method === 'GET' && url.pathname === '/trainings') {
    const studyId = url.searchParams.get('studyId')
    return studyId ? trainings.filter(training => training.studyId === Number(studyId)) : trainings
  }
  if (method === 'GET' && url.pathname === '/dashboard/summary') return dashboardSummary(seedData)

  if (method === 'POST' && url.pathname === '/email/generate') {
    const payload = JSON.parse(options?.body ?? '{}')
    const study = studies.find(item => item.id === Number(payload.studyId))
    const training = trainings.find(item => item.id === Number(payload.trainingId))
    const person = people.find(item => item.id === Number(payload.personId))

    if (!study || !training || !person) {
      throw new Error('Study, training, or person not found')
    }

    return generateEmail({ ...payload, study, training, person, people })
  }

  throw new Error('This action needs the StudyChaser API to be online.')
}
