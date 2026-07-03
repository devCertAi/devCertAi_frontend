import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@/types";
import api, {
  getAccessToken, clearAccessToken,
  getUserRole, setUserRole, clearUserRole,
  decodeRoleFromToken, currentRole,
  getIsRefreshing, getRefreshPromise,
} from "@/services/api";
import { connectSocket, disconnectSocket, updateSocketToken } from "@/services/socket";

type Role = "user" | "recruiter" | "admin";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isInitializing: boolean;

  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;

  login: (email: string, password: string) => Promise<void>;
  recruiterLogin: (accessToken: string, recruiter: User) => void;
  googleLogin: (googleAccessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  startRefreshTimer: (role?: Role) => void;
  stopRefreshTimer: () => void;
}

let refreshTimeout: ReturnType<typeof setTimeout> | null = null;

// ─── Session guard ──────────────────────────────────────────────────────────
// Every explicit identity change (login as user, login as recruiter, logout)
// bumps this counter and captures its own snapshot. fetchMe() (and the
// refresh timer) run async, multi-step network calls — if the person
// triggers a *fresh* login while one of those is still in flight, the old
// call must NOT be allowed to overwrite the newer login's state when it
// eventually resolves. Every async flow below checks its captured id against
// the live one immediately before calling set(), and silently drops its
// result if a newer session has since started. This is what makes it
// impossible for a stale "restore the recruiter session" call to clobber a
// user who just logged in (or vice versa), no matter how the network races.
let sessionId = 0;
function nextSession() { return ++sessionId; }

function msUntilRefresh(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    if (!payload.exp) return 10 * 60 * 1000
    const msLeft = payload.exp * 1000 - Date.now()
    return Math.max(10_000, Math.min(msLeft - 5 * 60 * 1000, 12 * 60 * 1000))
  } catch { return 10 * 60 * 1000 }
}

function refreshEndpointFor(role: Role | null) {
  return role === "recruiter" ? "/auth/recruiter/refresh" : "/auth/refresh";
}

function meEndpointFor(role: Role | null) {
  return role === "recruiter" ? "/auth/recruiter/me" : "/auth/me";
}

function logoutEndpointFor(role: Role | null) {
  return role === "recruiter" ? "/auth/recruiter/logout" : "/auth/logout";
}

/**
 * Best-effort revoke of the OTHER identity's server-side session.
 *
 * This app keeps exactly one active identity in the browser at a time
 * (one shared access token / one shared user object). If someone logged in
 * as a recruiter earlier and their recruiter refresh-token cookie is still
 * alive, and they now log in as a plain user (or vice versa), that old
 * cookie would otherwise sit there ready to be silently "restored" by
 * fetchMe() on a later visit — which is exactly what produced the
 * "logs in as the wrong role" bug. Calling the other role's logout here
 * revokes that leftover cookie server-side so there's nothing left to
 * silently restore. Safe to call even if no such session exists — the
 * backend just no-ops/clears an already-absent cookie.
 */
async function revokeOtherSession(justLoggedInAs: Role) {
  const otherEndpoint = justLoggedInAs === "recruiter" ? "/auth/logout" : "/auth/recruiter/logout";
  try { await api.post(otherEndpoint); } catch { /* nothing to revoke, ignore */ }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,
      isInitializing: !!localStorage.getItem("accessToken"),

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      // Single choke point for storing a token. Every login path (login,
      // recruiterLogin, googleLogin, fetchMe, refresh timer, OTP flows)
      // MUST route through this. It derives the role straight from the
      // token's own `role` claim and persists it alongside — so the cached
      // role flag can never silently drift out of sync with the token the
      // way it did before (a page manually calling setToken()+setUser()
      // without also remembering to call setUserRole() was the direct
      // cause of the recruiter-login-then-403 bug).
      setToken: (accessToken) => {
        set({ accessToken });
        if (accessToken) {
          localStorage.setItem("accessToken", accessToken);
          const role = decodeRoleFromToken(accessToken);
          if (role) setUserRole(role);
        } else {
          localStorage.removeItem("accessToken");
        }
      },

      startRefreshTimer: (role: Role = "user") => {
        get().stopRefreshTimer();
        const token = localStorage.getItem("accessToken");
        if (!token) return;

        const mySession = sessionId;
        const delay = msUntilRefresh(token);
        const endpoint = refreshEndpointFor(role);

        refreshTimeout = setTimeout(async () => {
          if (sessionId !== mySession) return; // a newer login/logout happened — stand down
          const currentToken = localStorage.getItem("accessToken");
          if (!currentToken) return;

          try {
            let newToken: string;

            // If interceptor is already refreshing, reuse its promise — don't race
            if (getIsRefreshing() && getRefreshPromise()) {
              newToken = await getRefreshPromise()!;
            } else {
              const { data } = await api.post(endpoint);
              newToken = data.data?.accessToken ?? data.accessToken;
            }

            if (sessionId !== mySession) return; // stale by the time the request came back
            get().setToken(newToken);
            updateSocketToken(newToken);
            get().startRefreshTimer(role);
          } catch {
            if (sessionId !== mySession) return;
            // Only logout if not already being handled by interceptor redirect
            if (!getIsRefreshing()) {
              get().stopRefreshTimer();
              get().setToken(null);
              clearUserRole();
              set({ user: null, isAuthenticated: false });
              disconnectSocket();
              window.location.href = role === "recruiter" ? "/auth/recruiter-login" : "/auth/login";
            }
          }
        }, delay);
      },

      stopRefreshTimer: () => {
        if (refreshTimeout) {
          clearTimeout(refreshTimeout);
          refreshTimeout = null;
        }
      },

      login: async (email, password) => {
        const mySession = nextSession();
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/login", { email, password });
          const { accessToken, user } = data.data;
          const role: Role = user?.role ?? "user";

          if (sessionId !== mySession) return; // superseded by another login while this was in flight

          get().setToken(accessToken);
          set({ user, isAuthenticated: true });
          connectSocket(accessToken, role);
          get().startRefreshTimer(role);
          void revokeOtherSession(role);
        } finally {
          set({ isLoading: false });
        }
      },

      recruiterLogin: (accessToken, recruiter) => {
        nextSession(); // invalidate any in-flight fetchMe()/refresh from a prior session
        const role: Role = "recruiter";
        get().setToken(accessToken);
        set({ user: { ...recruiter, role }, isAuthenticated: true });
        connectSocket(accessToken, role);
        get().startRefreshTimer(role);
        void revokeOtherSession(role);
      },

      googleLogin: async (googleAccessToken) => {
        const mySession = nextSession();
        set({ isLoading: true });
        try {
          const { data } = await api.post("/auth/google", {
            accessToken: googleAccessToken,
          });
          const { accessToken, user } = data.data;
          const role: Role = user?.role ?? "user";

          if (sessionId !== mySession) return;

          get().setToken(accessToken);
          set({ user, isAuthenticated: true });
          connectSocket(accessToken, role);
          get().startRefreshTimer(role);
          void revokeOtherSession(role);
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        nextSession(); // invalidate any in-flight fetchMe/refresh from this or any other session
        get().stopRefreshTimer();
        const role = (get().user?.role as Role | undefined) ?? (currentRole() as Role | null) ?? undefined;
        try {
          await api.post(logoutEndpointFor(role ?? null));
        } catch {}
        get().setToken(null);
        clearUserRole();
        set({ user: null, isAuthenticated: false });
        disconnectSocket();
      },

      // Restores a session from the httpOnly refresh cookie on app load.
      // Deliberately NOT called while sitting on an /auth/* page (see
      // App.tsx) — restoring a stale cached identity while someone is in
      // the middle of typing a fresh login for a *different* role is
      // exactly what caused "log in as user, land as recruiter".
      fetchMe: async () => {
        const mySession = nextSession();
        const token = localStorage.getItem("accessToken");
        if (!token) {
          set({ isInitializing: false });
          return;
        }

        try {
          // Role comes from the token itself first — the cached flag is
          // only a fallback for the rare case the token can't be decoded.
          const role: Role | null = decodeRoleFromToken(token) ?? (getUserRole() as Role | null);

          const refreshEndpoint = refreshEndpointFor(role);

          let freshToken: string;
          try {
            const { data: refreshData } = await api.post(refreshEndpoint);
            freshToken = refreshData.data.accessToken;
          } catch {
            if (sessionId !== mySession) return; // a fresh login already took over — don't stomp it
            get().setToken(null);
            clearUserRole();
            set({ user: null, isAuthenticated: false, isInitializing: false });
            return;
          }

          if (sessionId !== mySession) return; // superseded while the refresh call was in flight

          get().setToken(freshToken);

          const meEndpoint = meEndpointFor(role);
          const { data: meData } = await api.get(meEndpoint);

          if (sessionId !== mySession) return; // superseded while the /me call was in flight

          const user: User =
            role === "recruiter"
              ? { ...meData.data.recruiter, role: "recruiter" }
              : meData.data.user;

          set({ user, isAuthenticated: true });
          connectSocket(freshToken, role ?? "user");
          get().startRefreshTimer(role ?? "user");
        } catch {
          if (sessionId === mySession) {
            get().setToken(null);
            clearUserRole();
            set({ user: null, isAuthenticated: false });
          }
        } finally {
          set({ isInitializing: false }); // clear the boot spinner either way, even if superseded
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
      }),
    },
  ),
);

// When tab returns from sleep/background, setTimeout was frozen.
// Immediately check if token needs refreshing.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "visible") return;
  const token = localStorage.getItem("accessToken");
  if (!token) return;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return;
    const msLeft = payload.exp * 1000 - Date.now();
    const role = (decodeRoleFromToken(token) as Role) ?? (getUserRole() as Role) ?? "user";
    const mySession = sessionId;
    if (msLeft < 2 * 60 * 1000) {
      // expired or < 2 min — refresh now
      api.post(refreshEndpointFor(role))
        .then(({ data }) => {
          if (sessionId !== mySession) return;
          const newToken = data.data.accessToken;
          useAuthStore.getState().setToken(newToken);
          updateSocketToken(newToken);
          useAuthStore.getState().startRefreshTimer(role);
        })
        .catch(() => {
          if (sessionId !== mySession) return;
          if (!getIsRefreshing()) {
            clearAccessToken();
            clearUserRole();
            useAuthStore.setState({ user: null, isAuthenticated: false });
            disconnectSocket();
            window.location.href = role === "recruiter" ? "/auth/recruiter-login" : "/auth/login";
          }
        });
    } else if (msLeft < 6 * 60 * 1000) {
      // < 6 min — timer may have frozen, reschedule
      useAuthStore.getState().startRefreshTimer(role);
    }
  } catch {}
});
