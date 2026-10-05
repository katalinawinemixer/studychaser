export function parseJsonObject(body) {
  if (!body.trim()) return {}
  let payload
  try {
    payload = JSON.parse(body)
  } catch {
    throw Object.assign(new Error('Request body must be valid JSON'), { statusCode: 400 })
  }
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw Object.assign(new Error('Request body must be a JSON object'), { statusCode: 400 })
  }
  return payload
}
