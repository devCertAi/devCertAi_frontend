import axios, { AxiosRequestConfig } from 'axios'

// ─── Storage keys ─────────────────────────────────────────────────────────────
const ACCESS_KEY  = 'accessToken'
const ROLE_KEY    = 'userRole'      // 'user' | 'recruiter' | 'admin' — cache only, see decodeRoleFromToken()

export function getAccessToken()          { return localStorage.getItem(ACCESS_KEY) }
export function setAccessToken(t: string) { localStorage.setItem(ACCESS_KEY, t) }
export function clearAccessToken()        { localStorage.removeItem(ACCESS_KEY) }

export function getUserRole()             { return localStorage.getItem(ROLE_KEY) as 'user' | 'recruiter' | 'admin' | null }
export function setUserRole(r: string)    { localStorage.setItem(ROLE_KEY, r) }
export function clearUserRole()           { localStorage.removeItem(ROLE_KEY) }

export function decodeRoleFromToken(token: string | null): 'user' | 'recruiter' | 'admin' | null {
  if (!token) return null
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role ?? null
  } catch {
    return null
  }
}

export function currentRole(): 'user' | 'recruiter' | 'admin' | null {
  return decodeRoleFromToken(getAccessToken()) ?? getUserRole()
}

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,   // sends httpOnly refresh-token cookie automatically
  timeout: 15_000,
  headers: {
    // 🔧 sent on EVERY request now, so no call site can forget it —
    // backend's requireCsrfHeader checks for exactly this.
    'X-Requested-With': 'XMLHttpRequest',
  },
})

// ─── Request interceptor — attach Bearer token ────────────────────────────────
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// ─── Refresh state (prevents concurrent refresh storms) ──────────────────────
let isRefreshing = false
let refreshPromise: Promise<string> | null = null
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  pendingQueue = []
}

export function getRefreshPromise() { return refreshPromise }
export function getIsRefreshing()   { return isRefreshing }

// ─── Response interceptor — silent refresh on 401 ────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean }

    const status = error.response?.status

    const isRefreshEndpoint =
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/recruiter/refresh')

    if (status !== 401 || original._retry || isRefreshEndpoint) {
      return Promise.reject(error)
    }

    original._retry = true

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({
          resolve: (token) => {
            original.headers = original.headers ?? {}
            original.headers['Authorization'] = `Bearer ${token}`
            resolve(api(original))
          },
          reject,
        })
      })
    }

    isRefreshing = true

    const role = currentRole()
    const refreshUrl = role === 'recruiter' ? '/auth/recruiter/refresh' : '/auth/refresh'
    refreshPromise = api
      .post(refreshUrl)
      .then(({ data }) => data.data?.accessToken ?? data.accessToken)

    try {
      const newToken: string = await refreshPromise
      setAccessToken(newToken)
      processQueue(null, newToken)
      original.headers = original.headers ?? {}
      original.headers['Authorization'] = `Bearer ${newToken}`
      return api(original)
    } catch (refreshError) {
      processQueue(refreshError, null)
      clearAccessToken()
      clearUserRole()
      window.location.href = role === 'recruiter' ? '/auth/recruiter-login' : '/auth/login'
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  }
)

export default api