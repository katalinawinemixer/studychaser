import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

const DEFAULT_DATA_FILE = './data/db.json'

export function createStore(dataFile = process.env.DATA_FILE ?? DEFAULT_DATA_FILE) {
  const filePath = resolve(dataFile)

  async function read() {
    try {
      await access(filePath)
    } catch {
      await mkdir(dirname(filePath), { recursive: true })
      await writeFile(filePath, JSON.stringify({ studies: [], people: [], trainings: [] }, null, 2))
    }

    return JSON.parse(await readFile(filePath, 'utf8'))
  }

  async function write(data) {
    await mkdir(dirname(filePath), { recursive: true })
    await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`)
    return data
  }

  return { read, write, filePath }
}

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

function pick(source, keys) {
  return keys.reduce((out, key) => {
    if (Object.hasOwn(source, key)) out[key] = source[key]
    return out
  }, {})
}
