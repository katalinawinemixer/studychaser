const WRITE_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE'])

export function isReadOnlyDemo(env) {
  return String(env.READ_ONLY_DEMO ?? '').toLowerCase() === 'true'
}

export function isBlockedDemoWrite(request, segments) {
  if (!WRITE_METHODS.has(request.method)) return false
  return !(request.method === 'POST' && segments[1] === 'email' && segments[2] === 'generate')
}
