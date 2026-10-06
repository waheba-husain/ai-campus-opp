import { supabase } from './supabase'

const API_BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

/**
 * Centralized fetch with Supabase JWT attached.
 * Automatically adds Authorization: Bearer <token> when a session exists.
 * Throws on non-2xx with the backend's error message.
 */
export async function apiFetch(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData
  const headers = {
    // For file uploads the browser must set the content-type itself
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    ...options.headers,
  }

  let res
  try {
    res = await fetch(`${API_BASE}${path}`, { ...options, headers })
  } catch (err) {
    throw new Error('Could not reach the server. Check your connection.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    // Surface 401s as auth failures so callers can redirect
    if (res.status === 401) {
      const e = new Error(body.error || 'Your session has expired. Please sign in again.')
      e.status = 401
      throw e
    }
    const e = new Error(body.error || `Request failed (${res.status})`)
    e.status = res.status
    e.code = body.code
    throw e
  }

  return res.json()
}

// ── Opportunities ──────────────────────────────────────────────
export const opportunitiesApi = {
  list: (params = {}) => apiFetch(`/api/opportunities?${new URLSearchParams(params)}`),
  ranked: (params = {}) => apiFetch(`/api/opportunities/ranked?${new URLSearchParams(params)}`),
  triage: () => apiFetch('/api/opportunities/triage'),
  detail: (id) => apiFetch(`/api/opportunities/${id}`),
  extract: (rawText) => apiFetch('/api/opportunities/extract', {
    method: 'POST',
    body: JSON.stringify({ rawText }),
  }),
  extractBulk: (rawText) => apiFetch('/api/opportunities/extract-bulk', {
    method: 'POST',
    body: JSON.stringify({ rawText }),
  }),
  bulkSave: (candidates) => apiFetch('/api/opportunities/bulk-save', {
    method: 'POST',
    body: JSON.stringify({ candidates }),
  }),
  prep: (id) => apiFetch(`/api/opportunities/${id}/prep`),
}

// ── Profile ────────────────────────────────────────────────────
export const profileApi = {
  get: () => apiFetch('/api/profile'),
  extract: (resumeText) => apiFetch('/api/profile/extract', {
    method: 'POST',
    body: JSON.stringify({ resumeText }),
  }),
  extractPdf: (file) => {
    const fd = new FormData()
    fd.append('resume', file)
    return apiFetch('/api/profile/extract-pdf', { method: 'POST', body: fd })
  },
  update: (data) => apiFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
}

// ── Pipeline ───────────────────────────────────────────────────
export const pipelineApi = {
  list: (status) => apiFetch(`/api/pipeline${status ? `?status=${status}` : ''}`),
  add: (opportunityId, status = 'saved', notes = null) => apiFetch('/api/pipeline', {
    method: 'POST',
    body: JSON.stringify({ opportunityId, status, notes }),
  }),
  update: (id, data) => apiFetch(`/api/pipeline/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  remove: (id) => apiFetch(`/api/pipeline/${id}`, { method: 'DELETE' }),
}

export default apiFetch