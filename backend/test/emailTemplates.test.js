import assert from 'node:assert/strict'
import test from 'node:test'
import { generateEmail } from '../src/emailTemplates.js'
import { allowedEmailTypes, recommendedEmailType } from '../../shared/emailRules.js'

function fixture(status = 'sent') {
  const person = { id: 1, name: 'Taylor Example', email: 'taylor.example@example.org' }
  const pi = { id: 2, name: 'Dr. Riley Example', email: 'riley.example@example.org' }
  return {
    study: { id: 10, studyNumber: 'DEMO-1', title: 'Demo Study', pi: pi.name },
    training: { id: 20, studyId: 10, title: 'Protocol Training', version: 'v1', sentDate: 'Jan 1, 2026', staff: [{ personId: person.id, name: person.name, status }] },
    person, people: [person, pi], senderName: 'Alex Demo',
  }
}

test('a direct reminder uses the assigned staff member and stored training', () => {
  const email = generateEmail({ ...fixture(), type: 'first' })
  assert.equal(email.to, 'Taylor Example <taylor.example@example.org>')
  assert.match(email.subject, /DEMO-1/)
  assert.match(email.body, /Protocol Training/)
})

test('PI escalation separates the person owing training from the actual recipient', () => {
  const email = generateEmail({ ...fixture('overdue'), type: 'pi' })
  assert.equal(email.to, 'Dr. Riley Example <riley.example@example.org>')
  assert.equal(email.recipient.id, 2)
  assert.equal(email.staffMember.id, 1)
  assert.match(email.body, /Hi Dr\. Example/)
  assert.match(email.body, /Taylor Example has not yet acknowledged/)
})

test('an overdue PI receives a direct reminder and can never self-escalate', () => {
  const context = fixture('overdue')
  context.study.pi = context.person.name
  const member = context.training.staff[0]
  assert.equal(recommendedEmailType({ ...context, member }), 'overdue')
  assert.throws(() => generateEmail({ ...context, type: 'pi' }), error => error.statusCode === 409 && /self-escalation/.test(error.message))
  assert.equal(generateEmail({ ...context, type: 'overdue' }).to, 'Taylor Example <taylor.example@example.org>')
})

test('completed assignments allow confirmation and reject every reminder type', () => {
  const context = fixture('complete')
  assert.deepEqual(allowedEmailTypes({ ...context, member: context.training.staff[0] }), ['confirm'])
  for (const type of ['first', 'second', 'overdue', 'pi']) assert.throws(() => generateEmail({ ...context, type }), error => error.statusCode === 409)
  assert.match(generateEmail({ ...context, type: 'confirm' }).body, /received your acknowledgment/)
})

test('pending assignments cannot produce a completion confirmation or premature escalation', () => {
  for (const type of ['confirm', 'overdue', 'pi']) assert.throws(() => generateEmail({ ...fixture(), type }), error => error.statusCode === 409)
})

test('generation rejects a mismatched study, unassigned staff, unknown type, or missing PI address', () => {
  const context = fixture('overdue')
  assert.throws(() => generateEmail({ ...context, study: { ...context.study, id: 99 } }), error => error.statusCode === 400)
  assert.throws(() => generateEmail({ ...context, person: { ...context.person, id: 99 } }), error => error.statusCode === 400)
  assert.throws(() => generateEmail({ ...context, type: 'unknown' }), error => error.statusCode === 400)
  assert.throws(() => generateEmail({ ...context, people: [], type: 'pi' }), error => error.statusCode === 409)
  assert.throws(() => generateEmail({ ...context, people: [...context.people, { ...context.people[1], id: 3 }], type: 'pi' }), error => error.statusCode === 409)
})
