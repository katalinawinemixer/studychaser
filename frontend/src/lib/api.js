import { useEffect, useState } from 'react'
import { people, studies, trainings } from '../data/mockData'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000/api'
const LOCAL_API_BASE_URL = 'http://127.0.0.1:4000/api'

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

export function useApiData(loader, initialData) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
  }, [])

  return { data, loading, error }
}

async function apiRequest(path, options) {
  if (shouldUseFallbackApi()) {
    return fallbackRequest(path, options)
  }

  try {
    return await request(path, options)
  } catch (error) {
    if (canFallback(path, options)) {
      return fallbackRequest(path, options)
    }

    throw error
  }
}

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with ${response.status}`)
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
  const method = options?.method ?? 'GET'
  const url = new URL(path, 'http://studychaser.local')

  if (method === 'GET' && url.pathname === '/studies') return studies
  if (method === 'GET' && url.pathname === '/people') return people
  if (method === 'GET' && url.pathname === '/trainings') {
    const studyId = url.searchParams.get('studyId')
    return studyId ? trainings.filter(training => training.studyId === Number(studyId)) : trainings
  }
  if (method === 'GET' && url.pathname === '/dashboard/summary') return buildDashboard()

  if (method === 'POST' && url.pathname === '/email/generate') {
    const payload = JSON.parse(options?.body ?? '{}')
    const study = studies.find(item => item.id === Number(payload.studyId))
    const training = trainings.find(item => item.id === Number(payload.trainingId))
    const person = people.find(item => item.id === Number(payload.personId))

    if (!study || !training || !person) {
      throw new Error('Study, training, or person not found')
    }

    return generateEmail({ study, training, person, ...payload })
  }

  throw new Error('This action needs the StudyChaser API to be online.')
}

function buildDashboard() {
  const attentionItems = []

  for (const training of trainings) {
    const study = studies.find(candidate => candidate.id === training.studyId)

    for (const member of training.staff) {
      const needsReminder =
        member.status === 'overdue' ||
        ((member.status === 'reminded' || member.status === 'sent') && member.daysAgo >= training.cadenceDays)

      if (needsReminder) {
        attentionItems.push({
          person: member.name,
          personId: member.personId,
          training: training.title,
          trainingId: training.id,
          study: study?.studyNumber ?? 'Unknown study',
          studyId: study?.id,
          status: member.status,
          daysAgo: member.daysAgo,
          nextAction: member.status === 'overdue' ? 'Escalate to PI' : 'Send reminder',
        })
      }
    }
  }

  attentionItems.sort((a, b) => {
    const order = { overdue: 0, reminded: 1, sent: 2 }
    return (order[a.status] ?? 3) - (order[b.status] ?? 3)
  })

  const allStaff = trainings.flatMap(training => training.staff)

  return {
    stats: {
      overdueCount: allStaff.filter(member => member.status === 'overdue').length,
      awaitingCount: allStaff.filter(member => ['sent', 'reminded'].includes(member.status)).length,
      completedCount: allStaff.filter(member => member.status === 'complete').length,
      activeStudies: studies.filter(study => study.status === 'active').length,
    },
    attentionItems,
    studySummary: studies.map(study => ({
      id: study.id,
      studyNumber: study.studyNumber,
      title: study.title,
      activeTrainings: study.activeTrainings,
      completedTrainings: study.completedTrainings,
      coordinator: study.coordinator,
    })),
  }
}

function generateEmail({ study, training, person, type = 'first', senderName = 'Katalina M.' }) {
  const firstName = person.name.split(' ')[0]
  const piLastName = study.pi.split(' ').at(-1)
  const sig = `Best regards,\n${senderName}\nRegulatory Coordinator`

  const subjects = {
    first: `[${study.studyNumber}] ${training.title} - Training Follow-Up`,
    second: `[${study.studyNumber}] ${training.title} - Second Follow-Up Reminder`,
    overdue: `[${study.studyNumber}] ${training.title} - Overdue Acknowledgment Required`,
    confirm: `[${study.studyNumber}] ${training.title} - Acknowledgment Received`,
    pi: `[${study.studyNumber}] ${training.title} - Escalation: Pending Training Acknowledgment`,
  }

  const bodies = {
    first: `Hi ${firstName},

I hope you're doing well. I'm following up on the ${training.title} (${training.version}) for Study ${study.studyNumber} - ${study.title}.

Training documentation was distributed on ${training.sentDate}. Per protocol requirements, we ask that all study staff acknowledge receipt and completion of this training.

If you have already completed this training, please reply to this email to confirm so we may update our records.

Thank you for your time and continued involvement in this study.

${sig}`,

    second: `Hi ${firstName},

This is a second follow-up regarding the ${training.title} (${training.version}) for Study ${study.studyNumber}.

Our records indicate we have not yet received your acknowledgment. This training acknowledgment is required for regulatory compliance and must be documented in the study binder.

Please respond at your earliest convenience, or let me know if you have any questions about the training materials.

${sig}`,

    overdue: `Hi ${firstName},

I'm reaching out again regarding the outstanding ${training.title} (${training.version}) acknowledgment for Study ${study.studyNumber}.

This acknowledgment is now overdue. Per our site SOPs, all protocol training must be documented prior to participation in study-related activities.

Please respond to this email with your acknowledgment as soon as possible. If there is an issue preventing completion, please let me know so we can address it promptly.

${sig}`,

    confirm: `Hi ${firstName},

Thank you - we have received your acknowledgment for the ${training.title} (${training.version}) for Study ${study.studyNumber}.

Your training record has been updated and documentation will be filed in the study binder under:
${study.studyNumber} > Training > ${training.title}

No further action is needed on your end. Thank you for your prompt response.

${sig}`,

    pi: `Hi Dr. ${piLastName},

I'm writing to bring to your attention that ${person.name} has not yet acknowledged the ${training.title} (${training.version}) for Study ${study.studyNumber} - ${study.title}.

Training was distributed on ${training.sentDate}, and multiple follow-up reminders have been sent without response. Per our site SOPs and regulatory requirements, this training must be documented before study activities can continue.

Could you please assist in facilitating acknowledgment at your earliest convenience?

Thank you for your support.

${sig}`,
  }

  return {
    to: `${person.name} <${person.email}>`,
    subject: subjects[type] ?? subjects.first,
    body: bodies[type] ?? bodies.first,
  }
}
