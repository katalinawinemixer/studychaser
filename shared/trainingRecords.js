// Legacy `filedAt` contains a location, not a timestamp. Never infer a filing date from it.
export function completionStatus(member) {
  return member.completionStatus ?? (member.status === 'complete' ? 'complete' : 'pending')
}

export function filingReference(member) {
  return member.filingReference ?? member.filedAt ?? ''
}

export function filingStatus(member) {
  if (member.filingStatus === 'filed' && filingReference(member).trim()) return 'filed'
  if (member.filingStatus !== 'pending' && filingReference(member).trim()) return 'filed'
  return completionStatus(member) === 'complete' ? 'awaiting-filing' : 'not-ready'
}

export function trainingCounts(training) {
  const staff = training.staff ?? []
  return {
    total: staff.length,
    completed: staff.filter(member => completionStatus(member) === 'complete').length,
    filed: staff.filter(member => filingStatus(member) === 'filed').length,
    awaitingFiling: staff.filter(member => filingStatus(member) === 'awaiting-filing').length,
  }
}

export function needsFollowUp(member, cadenceDays) {
  return completionStatus(member) !== 'complete' && (member.status === 'overdue' ||
    (['sent', 'reminded'].includes(member.status) && member.daysAgo >= cadenceDays))
}

export function matchesWork(member, work, cadenceDays) {
  if (work === 'pending') return completionStatus(member) !== 'complete'
  if (work === 'follow-up') return needsFollowUp(member, cadenceDays)
  if (work === 'filing') return filingStatus(member) === 'awaiting-filing'
  if (work === 'filed') return filingStatus(member) === 'filed'
  if (work === 'complete') return completionStatus(member) === 'complete'
  return true
}

export function updateTrainingMember(training, index, payload, now = new Date().toISOString()) {
  const fail = message => { throw Object.assign(new Error(message), { statusCode: 400 }) }
  const current = training.staff[index]
  const next = { ...current }
  if (Object.hasOwn(payload, 'status')) {
    if (!['complete', 'sent', 'reminded', 'overdue', 'not-sent'].includes(payload.status)) fail('Invalid training status.')
    next.status = payload.status
    next.completionStatus = payload.status === 'complete' ? 'complete' : 'pending'
  }
  if (Object.hasOwn(payload, 'completionStatus')) {
    if (!['complete', 'pending'].includes(payload.completionStatus)) fail('Invalid completion status.')
    next.completionStatus = payload.completionStatus
    next.status = payload.completionStatus === 'complete' ? 'complete' : (current.status === 'complete' ? 'sent' : current.status)
  }
  if (Object.hasOwn(payload, 'filingStatus')) {
    if (!['filed', 'pending'].includes(payload.filingStatus)) fail('Invalid filing status.')
    next.filingStatus = payload.filingStatus
  }
  if (Object.hasOwn(payload, 'filingReference') || Object.hasOwn(payload, 'filedAt')) {
    const value = payload.filingReference ?? payload.filedAt
    if (typeof value !== 'string' || value.length > 1000) fail('Enter a filing reference of up to 1,000 characters.')
    next.filingReference = value.trim()
    // Preserve compatibility with clients that still read the old field.
    next.filedAt = next.filingReference
    if (!Object.hasOwn(payload, 'filingStatus')) next.filingStatus = next.filingReference ? 'filed' : 'pending'
  }
  for (const key of ['lastContacted', 'daysAgo']) {
    if (Object.hasOwn(payload, key)) next[key] = payload[key]
  }
  if (next.filingStatus === 'filed' && !filingReference(next).trim()) fail('A filing reference is required before marking evidence filed.')
  if (filingStatus(next) === 'filed' && completionStatus(next) !== 'complete') fail('Record training completion before filing completion evidence.')

  const snapshot = member => ({ completionStatus: completionStatus(member), filingStatus: filingStatus(member), filingReference: filingReference(member) })
  const before = snapshot(current)
  const after = snapshot(next)
  const events = []
  const add = (type, title, detail) => events.push({
    id: crypto.randomUUID(), type, title, detail, at: now,
    personId: current.personId, personName: current.name, version: training.version,
    source: 'local', before, after,
  })
  if (before.completionStatus !== after.completionStatus) {
    next.completedAt = after.completionStatus === 'complete' ? now : null
    add('completion', after.completionStatus === 'complete' ? 'Training completion recorded' : 'Training completion reopened', 'Local record update; no electronic signature was collected.')
  }
  if (before.filingStatus !== after.filingStatus || before.filingReference !== after.filingReference) {
    // Becoming ready to file is a consequence of completion, not a filing action.
    if (after.filingStatus === 'filed' || before.filingStatus === 'filed' || before.filingReference !== after.filingReference) {
      next.filingRecordedAt = after.filingStatus === 'filed' ? now : null
      add('filing', after.filingStatus === 'filed' ? 'Filing reference recorded' : 'Evidence marked awaiting filing', after.filingReference || 'No filing reference recorded.')
    }
  }
  if (['status', 'lastContacted', 'daysAgo'].some(key => Object.hasOwn(payload, key) && payload[key] !== current[key]) && before.completionStatus === after.completionStatus) {
    add('follow-up', 'Follow-up record updated', `Recorded status: ${next.status}.`)
  }
  training.staff[index] = next
  training.activity = [...(training.activity ?? []), ...events]
  return next
}
