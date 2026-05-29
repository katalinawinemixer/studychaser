import assert from 'node:assert/strict'
import test from 'node:test'
import { generateEmail } from '../src/emailTemplates.js'

test('generateEmail creates a recipient, subject, and body', () => {
  const email = generateEmail({
    study: { studyNumber: 'DEMO-1', title: 'Demo Study', pi: 'Dr. Riley Example' },
    training: { title: 'Protocol Training', version: 'v1', sentDate: 'Jan 1, 2026' },
    person: { name: 'Taylor Example', email: 'taylor.example@example.org' },
    type: 'first',
    senderName: 'Alex Demo',
  })

  assert.equal(email.to, 'Taylor Example <taylor.example@example.org>')
  assert.match(email.subject, /DEMO-1/)
  assert.match(email.body, /Protocol Training/)
})
