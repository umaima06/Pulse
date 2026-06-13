const trimTrailingSlash = (value) => value?.replace(/\/$/, '')

export const API_BASE = trimTrailingSlash(
  import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
)

export const AI_BASE = trimTrailingSlash(
  import.meta.env.VITE_AI_URL || 'http://localhost:5000'
)

export const apiUrl = (path) => `${API_BASE}${path}`
export const aiUrl = (path) => `${AI_BASE}${path}`
