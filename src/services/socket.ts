import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null
let connecting = false

function createSocket(): Socket {
  const s = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
    autoConnect: false,
    // Unbounded attempts with capped backoff — a backend restart (nodemon
    // in dev) can take a few seconds, and 5 fixed attempts can exhaust
    // before the server comes back up, permanently killing the socket.
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  })

  // A restart on the backend (nodemon) invalidates the current engine.io
  // session — the client will see this as a transport error and try to
  // reconnect. Each *reconnection* attempt is a brand-new handshake (no
  // stale sid), so this self-heals once the server is back up. Logged at
  // debug level so it doesn't look like a real bug during normal dev use.
  s.on('connect_error', (err) => {
    console.debug('[socket] connect_error (will retry):', err.message)
  })

  s.on('disconnect', (reason) => {
    console.debug('[socket] disconnected:', reason)
  })

  return s
}

export function getSocket(): Socket {
  if (!socket) socket = createSocket()
  return socket
}

/**
 * Connect socket with a Bearer token.
 * Skips connection for admin — the backend has no admin socket room
 * and the handshake would just fail with 400.
 */
export function connectSocket(token: string, role?: string) {
  // Admin has no socket rooms on the backend — skip entirely
  if (role === 'admin') return null

  // Don't connect without a valid token — causes the
  // "WebSocket closed before connection established" warning
  if (!token) return null

  const s = getSocket()

  // If already connected with same token, do nothing
  if (s.connected && (s.auth as { token?: string })?.token === token) return s

  // Guard against overlapping handshakes: calling connect() again while a
  // previous handshake is still in flight (not yet `connected`) can corrupt
  // the engine.io session and is a common source of stray 400s that have
  // nothing to do with the server restarting.
  if (connecting && !s.connected) return s

  // If connecting/open but token changed, disconnect first then reconnect
  if (s.connected) {
    s.disconnect()
  }

  s.auth = { token }
  connecting = true
  s.connect()
  s.once('connect', () => { connecting = false })
  s.once('connect_error', () => { connecting = false })

  return s
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
    connecting = false
  }
}

 
export function updateSocketToken(token: string) {
  if (socket) {
    socket.auth = { token }
  }
}