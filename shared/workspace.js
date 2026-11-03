import { completionStatus, filingStatus } from './trainingRecords.js'

export function recordCounts(staff = []) {
  return {
    assignmentCount: staff.length,
    missingTrainings: staff.filter(member => completionStatus(member) !== 'complete').length,
    completedTrainings: staff.filter(member => completionStatus(member) === 'complete').length,
    filedCount: staff.filter(member => filingStatus(member) === 'filed').length,
    awaitingFilingCount: staff.filter(member => filingStatus(member) === 'awaiting-filing').length,
  }
}

function dayNumber(value) {
  if (!value) return NaN
  const text = String(value)
  const date = Date.parse(/^\d{4}-\d{2}-\d{2}/.test(text) ? text.slice(0, 10) + 'T00:00:00Z' : text + ' UTC')
  return Math.floor(date / 86400000)
}

// All views describe the same assignments and the same explicit snapshot date.
// Stored legacy summary fields never override the records they summarize.
export function workspaceView(data) {
  const referenceDay = dayNumber(data.snapshotDate ?? new Date().toISOString())
  const trainings = (data.trainings ?? []).map(training => ({
    ...training,
    staff: (training.staff ?? []).map(member => {
      const age = referenceDay - dayNumber(member.lastContacted)
      return { ...member, daysAgo: Number.isFinite(age) ? Math.max(0, age) : member.daysAgo }
    }),
  }))
  const studies = (data.studies ?? []).map(study => {
    const items = trainings.filter(training => training.studyId === study.id)
    return {
      ...study,
      ...recordCounts(items.flatMap(training => training.staff)),
      trainingCount: items.length,
      activeTrainings: items.filter(training => training.staff.some(member => completionStatus(member) !== 'complete' || filingStatus(member) === 'awaiting-filing')).length,
    }
  })
  const people = (data.people ?? []).map(person => {
    const assignments = trainings.flatMap(training => training.staff.filter(member => member.personId === person.id))
    return { ...person, ...recordCounts(assignments) }
  })
  return { ...data, studies, trainings, people }
}
