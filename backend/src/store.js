import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
export { nextId, sanitizePerson, sanitizeStudy, sanitizeTraining } from './model.js'

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
