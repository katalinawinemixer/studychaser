import assert from 'node:assert/strict'
import test from 'node:test'
import { parseJsonObject } from '../src/requestBody.js'

for (const body of ['null', '[]', '42', 'true', '"text"', '{broken']) {
  test(`rejects a non-object or malformed body: ${body}`, () => {
    assert.throws(() => parseJsonObject(body), error => error.statusCode === 400)
  })
}

test('allows empty and object bodies', () => {
  assert.deepEqual(parseJsonObject('  '), {})
  assert.deepEqual(parseJsonObject('{"studyId":1}'), { studyId: 1 })
})
