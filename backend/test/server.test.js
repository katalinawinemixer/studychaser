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
