export function nextId(items) {
  return items.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
}

export function sanitizeStudy(payload) {
  return pick(payload, [
    'studyNumber',
    'title',
    'pi',
    'coordinator',
    'sponsor',
    'irb',
    'status',
    'activeTrainings',
    'completedTrainings',
  ])
}

export function sanitizePerson(payload) {
  return pick(payload, ['name', 'email', 'role', 'studyIds', 'missingTrainings', 'completedTrainings'])
}

export function sanitizeTraining(payload) {
  return pick(payload, ['studyId', 'title', 'version', 'sentDate', 'cadenceDays', 'staff'])
}

export function pick(source, keys) {
  return keys.reduce((out, key) => {
    if (Object.hasOwn(source, key)) out[key] = source[key]
    return out
  }, {})
}
