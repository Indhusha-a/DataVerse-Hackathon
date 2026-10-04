import { create } from 'zustand'
import { login as loginRequest, logout as logoutRequest } from '@/api/endpoints'
import { SESSION_EXPIRED_EVENT, readToken, writeToken } from '@/api/client'
import type { LoginResponse, Role } from '@/api/types'

export interface SessionUser {
  userId: string
  username: string
  fullName: string
  role: Role
  permissions: string[]
  depotId: string | null
  outletId: string | null
  avatarColor: string
}

const SESSION_KEY = 'waypoint.session'

const AVATAR_BY_ROLE: Record<Role, string> = {
  DISPATCHER: '#4f46e5',
  LOADER: '#0891b2',
  DRIVER: '#16a34a',
  STORE_MANAGER: '#d97706',
  ADMIN: '#475569',
}

function readSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw || !readToken()) return null
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

function writeSession(user: SessionUser | null) {
  try {
    if (user) localStorage.setItem(SESSION_KEY, JSON.stringify(user))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // Session persistence is best-effort.
  }
}

function toSession(response: LoginResponse): SessionUser {
  return {
    userId: response.userId,
    username: response.username,
    fullName: response.fullName,
    role: response.role,
    permissions: response.permissions,
    depotId: response.depotId,
    outletId: response.outletId,
    avatarColor: AVATAR_BY_ROLE[response.role],
  }
}

interface AuthState {
  currentUser: SessionUser | null
  signIn: (username: string, password: string) => Promise<SessionUser>
  signOut: () => void
  expire: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: readSession(),

  signIn: async (username, password) => {
    const response = await loginRequest(username, password)
    writeToken(response.token)
    const user = toSession(response)
    writeSession(user)
    set({ currentUser: user })
    return user
  },

  signOut: () => {
    logoutRequest().catch(() => undefined)
    writeToken(null)
    writeSession(null)
    set({ currentUser: null })
  },

  expire: () => {
    writeToken(null)
    writeSession(null)
    set({ currentUser: null })
  },
}))

if (typeof window !== 'undefined') {
  window.addEventListener(SESSION_EXPIRED_EVENT, () => useAuthStore.getState().expire())
}
