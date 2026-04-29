import assert from 'node:assert/strict'
import test from 'node:test'
import { generateEmail } from '../src/emailTemplates.js'

test('generateEmail creates a recipient, subject, and body', () => {
  const email = generateEmail({
    study: { studyNumber: 'ABC-1', title: 'Demo Study', pi: 'Dr. Sarah Chen' },
    training: { title: 'Protocol Training', version: 'v1', sentDate: 'Jan 1, 2026' },
    person: { name: 'Peter Thompson', email: 'peter@example.com' },
    type: 'first',
    senderName: 'Katalina M.',
  })

  assert.equal(email.to, 'Peter Thompson <peter@example.com>')
  assert.match(email.subject, /ABC-1/)
  assert.match(email.body, /Protocol Training/)
})
