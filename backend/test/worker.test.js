import assert from 'node:assert/strict'
import test from 'node:test'
import { isBlockedDemoWrite, isReadOnlyDemo } from '../src/demoMode.js'

test('read-only demo flag is explicit', () => {
  assert.equal(isReadOnlyDemo({ READ_ONLY_DEMO: 'true' }), true)
  assert.equal(isReadOnlyDemo({ READ_ONLY_DEMO: 'false' }), false)
  assert.equal(isReadOnlyDemo({}), false)
})

test('read-only demo blocks data mutations but allows email generation', () => {
  assert.equal(isBlockedDemoWrite(new Request('https://demo.test/api/studies', { method: 'POST' }), ['api', 'studies']), true)
  assert.equal(isBlockedDemoWrite(new Request('https://demo.test/api/studies/1', { method: 'PATCH' }), ['api', 'studies', '1']), true)
  assert.equal(isBlockedDemoWrite(new Request('https://demo.test/api/trainings/1', { method: 'DELETE' }), ['api', 'trainings', '1']), true)
  assert.equal(isBlockedDemoWrite(new Request('https://demo.test/api/email/generate', { method: 'POST' }), ['api', 'email', 'generate']), false)
  assert.equal(isBlockedDemoWrite(new Request('https://demo.test/api/studies', { method: 'GET' }), ['api', 'studies']), false)
})
