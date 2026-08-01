/**
 * api.js — central HTTP client for Kribo Nepal frontend.
 *
 * All calls go to VITE_API_URL (default: http://127.0.0.1:8000).
 * JWT is automatically attached from localStorage when present.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

/**
 * Core fetch wrapper.
 */
async function request(path, { json, ...options } = {}) {
  const token = localStorage.getItem('kribo_token')

  const headers = {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers,
      body: json ? JSON.stringify(json) : options.body,
    })
  } catch {
    // Try fallback to localhost if 127.0.0.1 failed
    try {
      const fallbackUrl = BASE_URL.includes('127.0.0.1')
        ? BASE_URL.replace('127.0.0.1', 'localhost')
        : BASE_URL.replace('localhost', '127.0.0.1')
      res = await fetch(`${fallbackUrl}${path}`, {
        ...options,
        headers,
        body: json ? JSON.stringify(json) : options.body,
      })
    } catch {
      throw new Error('Could not connect to backend server. Please make sure the backend Python server is running on port 8000.')
    }
  }

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const detail = data?.detail
    const message =
      Array.isArray(detail)
        ? detail.map((e) => e.msg).join(', ')
        : typeof detail === 'string'
        ? detail
        : 'Failed to complete registration or login. Please check your information.'
    throw new Error(message)
  }

  return data
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

export const authApi = {
  register: (body) =>
    request('/api/auth/register', { method: 'POST', json: body }),

  login: (body) =>
    request('/api/auth/login', { method: 'POST', json: body }),
}

export default request
