import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { workspaceView } from '../../shared/workspace.js'
import { buildDashboard } from '../src/dashboard.js'
import { matchesWork, updateTrainingMember } from '../../shared/trainingRecords.js'

const seed = JSON.parse(await readFile(new URL('../data/db.json', import.meta.url)))
test('all summaries derive from the same assignments, never the stored legacy totals', () => {
  const data = workspaceView(seed)
  assert.equal(data.people.find(person => person.id === 2).missingTrainings, 1)
  assert.equal(data.people.find(person => person.id === 3).missingTrainings, 2)
  assert.equal(data.people.reduce((sum, person) => sum + person.completedTrainings, 0), 9)
  assert.equal(data.studies.reduce((sum, study) => sum + study.completedTrainings, 0), 9)
  assert.equal(data.studies.reduce((sum, study) => sum + study.assignmentCount, 0), 15)
  const dashboard = buildDashboard(seed)
  assert.equal(dashboard.stats.completedCount, 9)
  assert.equal(dashboard.stats.pendingCount, 6)
  assert.equal(dashboard.stats.assignmentCount, 15)
  assert.equal(dashboard.filingItems.length, 7)
  assert.equal(dashboard.attentionItems.length, 6, 'recorded contact dates determine what is due in the snapshot')
  assert.equal(dashboard.attentionItems.find(item => item.personId === 5).emailType, 'overdue')
  assert.equal(seed.people.find(person => person.id === 2).missingTrainings, 0, 'view does not mutate stored data')
})

test('completion and filing changes are reflected by every aggregate and work filter', () => {
  const data = structuredClone(seed)
  const training = data.trainings.find(item => item.id === 4)
  const index = training.staff.findIndex(member => member.personId === 2)
  updateTrainingMember(training, index, { completionStatus: 'complete' })
  let view = workspaceView(data)
  assert.equal(view.people.find(person => person.id === 2).missingTrainings, 0)
  assert.equal(view.people.find(person => person.id === 2).awaitingFilingCount, 2)
  assert.equal(buildDashboard(data).stats.completedCount, 10)
  assert.equal(buildDashboard(data).filingItems.length, 8)
  assert.equal(matchesWork(training.staff[index], 'pending', training.cadenceDays), false)
  assert.equal(matchesWork(training.staff[index], 'filing', training.cadenceDays), true)
  updateTrainingMember(training, index, { filingStatus: 'filed', filingReference: 'Demo binder > GCP > Jordan' })
  view = workspaceView(data)
  assert.equal(view.people.find(person => person.id === 2).awaitingFilingCount, 1)
  assert.equal(buildDashboard(data).stats.filedCount, 3)
  assert.equal(matchesWork(training.staff[index], 'filed', training.cadenceDays), true)
})

test('contact ages share an explicit snapshot date across views', () => {
  const data = workspaceView(seed)
  assert.equal(data.trainings[0].staff.find(item => item.personId === 1).daysAgo, 14)
  assert.equal(buildDashboard(seed).snapshotDate, '2025-12-29')
  const changedSnapshot = workspaceView({ ...seed, snapshotDate: '2025-12-30' })
  assert.equal(changedSnapshot.trainings[0].staff.find(item => item.personId === 1).daysAgo, 15)
})
