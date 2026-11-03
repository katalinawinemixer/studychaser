import assert from 'node:assert/strict'
import { once } from 'node:events'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test, { after, before } from 'node:test'

let server
let directory
let baseUrl
before(async () => {
  directory = await mkdtemp(join(tmpdir(), 'studychaser-test-'))
  const dataFile = join(directory, 'db.json')
  await writeFile(dataFile, await readFile(new URL('../data/db.json', import.meta.url)))
  const previousPort = process.env.PORT
  const previousDataFile = process.env.DATA_FILE
  process.env.PORT = '0'
  process.env.DATA_FILE = dataFile
  try {
    ;({ server } = await import('../src/server.js'))
    if (!server.listening) await once(server, 'listening')
    baseUrl = `http://127.0.0.1:${server.address().port}`
  } finally {
    if (previousPort === undefined) delete process.env.PORT
    else process.env.PORT = previousPort
    if (previousDataFile === undefined) delete process.env.DATA_FILE
    else process.env.DATA_FILE = previousDataFile
  }
})
after(async () => {
  if (server) await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()))
  if (directory) await rm(directory, { recursive: true, force: true })
})

for (const body of ['null', '[]', '42', '{broken']) {
  test(`HTTP rejects invalid request body ${body} with 400`, async () => {
    const response = await fetch(`${baseUrl}/api/studies`, { method: 'POST', body })
    assert.equal(response.status, 400)
    assert.match((await response.json()).error, /Request body must be/)
  })
}

test('email previews use stored records even if payload tries to replace them', async () => {
  const response = await fetch(`${baseUrl}/api/email/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studyId: 1, trainingId: 1, personId: 1, person: null, training: null, study: null }),
  })
  assert.equal(response.status, 200)
  const preview = await response.json()
  assert.match(preview.subject, /DEMO-ONC-001/)
  assert.equal(typeof preview.to, 'string')
})

test('HTTP summaries agree and invalid email selections are rejected without changing records', async () => {
  const get = path => fetch(`${baseUrl}/api/${path}`).then(response => response.json())
  const before = await get('trainings')
  const people = await get('people')
  const studies = await get('studies')
  const dashboard = await get('dashboard/summary')
  assert.equal(people.find(person => person.id === 2).missingTrainings, 1)
  assert.equal(people.reduce((sum, person) => sum + person.completedTrainings, 0), dashboard.stats.completedCount)
  assert.equal(studies.reduce((sum, study) => sum + study.completedTrainings, 0), dashboard.stats.completedCount)
  for (const payload of [
    { studyId: 1, trainingId: 1, personId: 2, type: 'second' },
    { studyId: 2, trainingId: 3, personId: 5, type: 'pi' },
    { studyId: 2, trainingId: 1, personId: 1, type: 'first' },
  ]) {
    const response = await fetch(`${baseUrl}/api/email/generate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    assert.ok([400, 409].includes(response.status))
  }
  assert.deepEqual(await get('trainings'), before)
})

test('HTTP saves independent completion and filing with append-only event history', async () => {
  const get = () => fetch(`${baseUrl}/api/trainings/3`).then(response => response.json())
  const original = await get()
  const patch = payload => fetch(`${baseUrl}/api/trainings/3/staff/5`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
  })
  assert.equal((await patch({ filingStatus: 'filed', filingReference: 'Example binder' })).status, 400)
  assert.deepEqual(await get(), original)
  assert.equal((await patch({ completionStatus: 'complete', activity: [], completedAt: 'forged-date' })).status, 200)
  let saved = await get()
  const member = saved.staff.find(item => item.personId === 5)
  assert.equal(member.completionStatus, 'complete')
  assert.equal(member.filingRecordedAt, undefined)
  assert.notEqual(member.completedAt, 'forged-date')
  assert.deepEqual(saved.activity.slice(0, original.activity.length), original.activity)
  assert.equal((await patch({ filingStatus: 'filed', filingReference: 'Example binder > v2.0' })).status, 200)
  saved = await get()
  assert.equal(saved.activity.at(-1).type, 'filing')
  assert.equal(saved.staff.find(item => item.personId === 5).completedAt, member.completedAt)
})

test('preparing a preview does not change completion, filing, or recorded history', async () => {
  const get = () => fetch(`${baseUrl}/api/trainings/1`).then(response => response.json())
  const before = await get()
  const response = await fetch(`${baseUrl}/api/email/generate`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studyId: 1, trainingId: 1, personId: 1 }),
  })
  assert.equal(response.status, 200)
  assert.deepEqual(await get(), before)
})
