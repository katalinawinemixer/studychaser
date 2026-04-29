import { useEffect, useState } from 'react'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000/api'

export async function apiGet(path) {
  return request(path)
}

export async function apiPost(path, body) {
  return request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function useApiData(loader, initialData) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    setLoading(true)
    setError('')

    Promise.resolve()
      .then(loader)
      .then(result => {
        if (active) setData(result)
      })
      .catch(err => {
        if (active) setError(err.message || 'Unable to load data')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  return { data, loading, error }
}

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.error ?? `Request failed with ${response.status}`)
  }

  return data
}
