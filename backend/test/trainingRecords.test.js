import assert from 'node:assert/strict'
import test from 'node:test'
import { completionStatus, filingStatus, trainingCounts, updateTrainingMember } from '../../shared/trainingRecords.js'
import { buildDashboard } from '../src/dashboard.js'

test('legacy completion is independent of filing and never invents dates', () => {
  const member = { personId: 1, status: 'complete', lastContacted: 'Dec 3, 2025' }
  assert.equal(completionStatus(member), 'complete')
  assert.equal(filingStatus(member), 'awaiting-filing')
  const filed = { ...member, filedAt: 'Binder > Training' }
  assert.equal(filingStatus(filed), 'filed')
  assert.equal(filed.completedAt, undefined)
  assert.equal(filed.filingRecordedAt, undefined)
})

test('dashboard and detail totals distinguish complete, filed, and awaiting filing', () => {
  const training = { id: 1, studyId: 1, staff: [
    { status: 'complete' }, { status: 'complete', filedAt: 'Binder' },
    { status: 'overdue', completionStatus: 'complete' }, { status: 'overdue' },
  ] }
  assert.deepEqual(trainingCounts(training), { total: 4, completed: 3, filed: 1, awaitingFiling: 2 })
  const result = buildDashboard({ studies: [], trainings: [training] })
  assert.equal(result.stats.completedCount, 3)
  assert.equal(result.stats.filedCount, 1)
  assert.equal(result.stats.awaitingFilingCount, 2)
  assert.equal(result.attentionItems.length, 1)
})

test('completion and filing create separate dated events and preserve prior evidence', () => {
  const training = { version: 'v4', staff: [{ personId: 1, name: 'Demo', status: 'sent' }], activity: [{ id: 'older', title: 'Earlier event' }] }
  const completeDate = '2026-11-02T21:00:00.000Z'
  const filedDate = '2026-11-02T22:00:00.000Z'
  updateTrainingMember(training, 0, { completionStatus: 'complete', activity: [] }, completeDate)
  assert.equal(filingStatus(training.staff[0]), 'awaiting-filing')
  assert.equal(training.activity.length, 2)
  assert.equal(training.staff[0].completedAt, completeDate)
  updateTrainingMember(training, 0, { filingStatus: 'filed', filingReference: ' Binder > v4 ' }, filedDate)
  assert.equal(training.staff[0].completedAt, completeDate)
  assert.equal(training.staff[0].filingRecordedAt, filedDate)
  assert.equal(training.activity.length, 3)
  assert.equal(training.activity[2].before.filingStatus, 'awaiting-filing')
  assert.equal(training.activity[2].after.filingReference, 'Binder > v4')
  updateTrainingMember(training, 0, { filingStatus: 'filed', filingReference: 'Binder > v4' }, filedDate)
  assert.equal(training.activity.length, 3, 'Saving an unchanged record must not manufacture events')
})

test('invalid filing updates fail atomically', () => {
  for (const payload of [
    { filingStatus: 'filed' },
    { filingStatus: 'filed', filingReference: 'Binder' },
    { completionStatus: 'unknown' },
    { completionStatus: 'complete', filingStatus: 'filed', filingReference: '   ' },
  ]) {
    const training = { staff: [{ personId: 1, status: 'sent' }] }
    const before = structuredClone(training)
    assert.throws(() => updateTrainingMember(training, 0, payload), error => error.statusCode === 400)
    assert.deepEqual(training, before)
  }
})

test('reopening a completed and filed record retains the previous filing evidence in history', () => {
  const training = { staff: [{ personId: 1, status: 'complete', filedAt: 'Original binder' }] }
  assert.throws(() => updateTrainingMember(training, 0, { completionStatus: 'pending' }), /Record training completion/)
  updateTrainingMember(training, 0, { completionStatus: 'pending', filingStatus: 'pending', filingReference: '' })
  assert.equal(filingStatus(training.staff[0]), 'not-ready')
  assert.equal(training.activity.at(-1).before.filingReference, 'Original binder')
})

test('older clients can still record filing through the legacy reference field', () => {
  const training = { staff: [{ personId: 1, status: 'complete', filingStatus: 'pending' }] }
  updateTrainingMember(training, 0, { filedAt: 'Legacy client > Training' })
  assert.equal(filingStatus(training.staff[0]), 'filed')
  assert.equal(training.staff[0].filingReference, 'Legacy client > Training')
  assert.equal(training.activity[0].type, 'filing')
})
