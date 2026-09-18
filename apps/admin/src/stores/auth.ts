import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@portal/shared-types'
import { authApi } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean

  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User) => void
  initializeAuth: () => Promise<void>
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email, password) => {
        const response = await authApi.login({ email, password })
        localStorage.setItem('auth_token', response.token)
        set({
          user: response.user,
          token: response.token,
          isAuthenticated: true,
        })
      },

      logout: async () => {
        try {
          await authApi.logout()
        } catch {
          // Ignorar errores de logout — limpiar igual
        }
        localStorage.removeItem('auth_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user }),

      initializeAuth: async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
          set({ isLoading: false, isAuthenticated: false })
          return
        }

        try {
          const user = await authApi.me()
          set({ user, isAuthenticated: true, isLoading: false })
        } catch {
          localStorage.removeItem('auth_token')
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
)

