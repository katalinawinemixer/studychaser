import { useEffect, useState } from 'react'

const storageKey = 'studychaser-preview-activity-v1'
const changeEvent = 'studychaser-preview-activity'
let memory = null

function readEvents() {
  if (memory) return memory
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? '[]')
    memory = Array.isArray(saved) ? saved.filter(event => event.type === 'preview' && typeof event.at === 'string').slice(-100) : []
  } catch { memory = [] }
  return memory
}

export function recordPreviewActivity({ training, person, emailType }) {
  const event = {
    id: crypto.randomUUID(), type: 'preview', source: 'browser', at: new Date().toISOString(),
    trainingId: training.id, version: training.version, personId: person.id, personName: person.name,
    title: emailType === 'pi' ? 'PI escalation preview prepared' : emailType === 'confirm' ? 'Completion confirmation preview prepared' : 'Reminder preview prepared',
    detail: 'Preview only. No email was sent and no training or filing status was changed.',
  }
  memory = [...readEvents(), event].slice(-100)
  try { sessionStorage.setItem(storageKey, JSON.stringify(memory)) } catch { /* Keep this session usable without storage. */ }
  window.dispatchEvent(new Event(changeEvent))
}

export function usePreviewActivity(trainingId) {
  const [events, setEvents] = useState(() => readEvents())
  useEffect(() => {
    const update = () => setEvents([...readEvents()])
    window.addEventListener(changeEvent, update)
    return () => window.removeEventListener(changeEvent, update)
  }, [])
  return events.filter(event => event.trainingId === trainingId)
}
