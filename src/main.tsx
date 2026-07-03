import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'

// ── DOM safety patch ──────────────────────────────────────────────
// Devbot (and other playful UI bits) occasionally mutate text nodes
// that React also manages (e.g. wrapping heading words on hover).
// When both React and that direct DOM code try to clean up the same
// node, the browser can throw:
//   "Failed to execute 'removeChild' on 'Node': The node to be
//    removed is not a child of this node."
// This is the same class of error seen with browser-extension DOM
// conflicts. We make removeChild/insertBefore defensive so a stale
// reference never crashes the whole app — it's a no-op instead of
// an uncaught exception that trips the ErrorBoundary.
const patchNode = <K extends 'removeChild' | 'insertBefore'>(
  proto: typeof Node.prototype,
  key: K
) => {
  const original = proto[key] as any
  ;(proto[key] as any) = function (this: Node, ...args: any[]) {
    try {
      return original.apply(this, args)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotFoundError') {
        return args[0]
      }
      throw err
    }
  }
}
patchNode(Node.prototype, 'removeChild')
patchNode(Node.prototype, 'insertBefore')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </BrowserRouter>
)