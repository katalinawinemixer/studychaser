import { completionStatus } from './trainingRecords.js'

export const EMAIL_TYPES = [
  { value: 'first', label: 'First reminder' },
  { value: 'second', label: 'Second reminder' },
  { value: 'overdue', label: 'Direct overdue reminder' },
  { value: 'confirm', label: 'Completion confirmation' },
  { value: 'pi', label: 'Escalate to PI' },
]

const normalizedName = name => (name ?? '').replace(/^Dr\.?\s+/i, '').trim().toLowerCase()
export function isStudyPi(study, person) {
  return Boolean(study && person && (study.piPersonId != null
    ? study.piPersonId === (person.id ?? person.personId)
    : normalizedName(study.pi) === normalizedName(person.name)))
}
export function escalationRecipient(study, people = []) {
  const candidates = people.filter(person => isStudyPi(study, person) && person.email)
  return candidates.length === 1 ? candidates[0] : undefined
}
export function allowedEmailTypes({ study, member, people = [] }) {
  if (!member) return []
  if (completionStatus(member) === 'complete') return ['confirm']
  const types = ['first', 'second']
  if (member.status === 'overdue') {
    types.push('overdue')
    if (!isStudyPi(study, member) && escalationRecipient(study, people)) types.push('pi')
  }
  return types
}
export function recommendedEmailType(context) {
  const allowed = allowedEmailTypes(context)
  if (allowed.includes('confirm')) return 'confirm'
  if (allowed.includes('pi')) return 'pi'
  if (allowed.includes('overdue')) return 'overdue'
  return context.member?.status === 'reminded' ? 'second' : 'first'
}
