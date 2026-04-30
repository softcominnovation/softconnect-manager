import { create } from 'zustand'
import { api } from '@/lib/api'
import type { AdminUser } from '@/lib/types'

interface AuthStore {
  user: AdminUser | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  loadFromStorage: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string): Promise<boolean> => {
    try {
      const data = await api.login(email, password)
      set({ user: data.user, token: data.token, isAuthenticated: true })
      if (typeof window !== 'undefined') {
        localStorage.setItem('sc-token', data.token)
        localStorage.setItem('sc-user', JSON.stringify(data.user))
      }
      return true
    } catch {
      return false
    }
  },

  logout: (): void => {
    set({ user: null, token: null, isAuthenticated: false })
    if (typeof window !== 'undefined') {
      localStorage.removeItem('sc-token')
      localStorage.removeItem('sc-user')
    }
  },

  loadFromStorage: async (): Promise<void> => {
    set({ isLoading: true })
    try {
      if (typeof window === 'undefined') {
        set({ isLoading: false })
        return
      }
      const savedToken = localStorage.getItem('sc-token')
      if (!savedToken) {
        set({ isLoading: false })
        return
      }
      const user = await api.me(savedToken)
      set({ user, token: savedToken, isAuthenticated: true })
    } catch {
      get().logout()
    } finally {
      set({ isLoading: false })
    }
  },
}))
