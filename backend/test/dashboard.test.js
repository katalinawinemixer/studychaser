import assert from 'node:assert/strict'
import test from 'node:test'
import { buildDashboard } from '../src/dashboard.js'

test('buildDashboard returns front-end-ready counts and attention items', () => {
  const output = buildDashboard({
    studies: [{ id: 1, studyNumber: 'ABC-1', title: 'Demo', status: 'active', activeTrainings: 1, completedTrainings: 2, coordinator: 'Katalina' }],
    trainings: [{
      id: 10,
      studyId: 1,
      title: 'Protocol Training',
      cadenceDays: 7,
      staff: [
        { personId: 1, name: 'Ada Lovelace', status: 'complete', daysAgo: null },
        { personId: 2, name: 'Grace Hopper', status: 'sent', daysAgo: 8 },
        { personId: 3, name: 'Katherine Johnson', status: 'overdue', daysAgo: 14 },
      ],
    }],
  })

  assert.equal(output.stats.overdueCount, 1)
  assert.equal(output.stats.awaitingCount, 1)
  assert.equal(output.stats.completedCount, 1)
  assert.equal(output.stats.activeStudies, 1)
  assert.deepEqual(output.attentionItems.map((item) => item.status), ['overdue', 'sent'])
})
