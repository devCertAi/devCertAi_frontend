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
// SINGLE mutex shared by every caller in the app (the reactive 401 interceptor
// below, authStore's proactive refresh timer, and the visibilitychange
// wake-up check). Previously the proactive timer called `/auth/refresh`
// directly, bypassing this file's isRefreshing flag entirely — so it was
// possible for the timer's refresh and a heartbeat/answer-save request's
// reactive 401 refresh to both fire at once, each carrying the SAME
// (not-yet-rotated) refresh cookie. The backend rotates the refresh token on
// every /auth/refresh call, so the second of the two concurrent calls looks
// like reuse of an already-rotated token — which the backend treats as a
// stolen-token signal and revokes the user's ENTIRE session, even though the
// first call had just succeeded. That forced a hard logout in the middle of
// things like an active exam. Routing every refresh through this one
// function/promise closes that race for good.
let isRefreshing = false
let refreshPromise: Promise<string> | null = null
let pendingQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  pendingQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)))
  pendingQueue = []
}

export function getRefreshPromise() { return refreshPromise }
export function getIsRefreshing()   { return isRefreshing }

/**
 * The ONE place in the app allowed to POST /auth/refresh (or the recruiter
 * variant). Every caller — the 401 interceptor, authStore's proactive timer,
 * and the visibility-change wake check — must go through this. If a refresh
 * is already in flight, callers get the SAME promise instead of firing their
 * own request, so at most one refresh call is ever outstanding at a time.
 */
export function refreshAccessToken(role: 'user' | 'recruiter' | 'admin' | null = null): Promise<string> {
  if (isRefreshing && refreshPromise) return refreshPromise

  isRefreshing = true
  const resolvedRole = role ?? currentRole()
  const refreshUrl = resolvedRole === 'recruiter' ? '/auth/recruiter/refresh' : '/auth/refresh'

  refreshPromise = api
    .post(refreshUrl)
    .then(({ data }) => {
      const token = data.data?.accessToken ?? data.accessToken
      setAccessToken(token)
      processQueue(null, token)
      return token
    })
    .catch((err) => {
      processQueue(err, null)
      throw err
    })
    .finally(() => {
      isRefreshing = false
      refreshPromise = null
    })

  return refreshPromise
}

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

    const role = currentRole()

    try {
      const newToken = await refreshAccessToken(role)
      original.headers = original.headers ?? {}
      original.headers['Authorization'] = `Bearer ${newToken}`
      return api(original)
    } catch (refreshError) {
      clearAccessToken()
      clearUserRole()
      // Preserve exactly where the person was (e.g. an in-progress exam
      // attempt) so login can drop them right back there afterwards instead
      // of losing their place. The exam page itself reloads the attempt
      // (questions/answers/violations) straight from the server on mount,
      // so nothing is actually lost server-side — this just avoids the
      // jarring "kicked out to a blank login page" experience.
      const returnTo = window.location.pathname + window.location.search
      try { sessionStorage.setItem('sessionExpiredNotice', '1') } catch {}
      const loginPath = role === 'recruiter' ? '/auth/recruiter-login' : '/auth/login'
      window.location.href = `${loginPath}?next=${encodeURIComponent(returnTo)}`
      return Promise.reject(refreshError)
    }
  }
)

export default api