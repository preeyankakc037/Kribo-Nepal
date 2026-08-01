/**
 * api.js — central HTTP client for Kribo Nepal frontend.
 *
 * All calls go to VITE_API_URL (default: http://localhost:8000).
 * JWT is automatically attached from localStorage when present.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Core fetch wrapper.
 * @param {string} path    — e.g. "/api/auth/login"
 * @param {object} options — standard fetch options + optional `json` body shorthand
 */
async function request(path, { json, ...options } = {}) {
  const token = localStorage.getItem('kribo_token')

  const headers = {
    ...(json ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
    body: json ? JSON.stringify(json) : options.body,
  })

  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const detail = data?.detail
    const message =
      Array.isArray(detail)
        ? detail.map((e) => e.msg).join(', ')
        : typeof detail === 'string'
        ? detail
        : 'Something went wrong. Please try again.'
    throw new Error(message)
  }

  return data
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

export const authApi = {
  /**
   * Register a new farmer or broker.
   * Sends all 3 form steps in one request.
   */
  register: (body) =>
    request('/api/auth/register', { method: 'POST', json: body }),

  /**
   * Login with mobile/email + password.
   * Returns { access_token, token_type, user }.
   */
  login: (body) =>
    request('/api/auth/login', { method: 'POST', json: body }),
}

export default request
