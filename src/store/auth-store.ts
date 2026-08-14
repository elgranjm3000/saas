import { create } from 'zustand'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types/auth'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (user: User, token: string) => void
  clearAuth: () => void
  updateUser: (user: User) => void
  setLoading: (loading: boolean) => void
  logout: () => Promise<void>
  signIn: (email: string, password: string) => Promise<User>
  loadUser: () => Promise<void>
}

async function fetchAppUser(authId: string): Promise<User | null> {
  const supabase = createClient()

  const { data: appUser, error } = await supabase
    .from('users')
    .select('*')
    .eq('auth_id', authId)
    .single()

  if (error || !appUser) return null

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('id', appUser.company_id)
    .single()

  return { ...appUser, company } as User
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  setAuth: (user, token) => set({ user, token, isAuthenticated: true, isLoading: false }),
  clearAuth: () => set({ user: null, token: null, isAuthenticated: false }),
  updateUser: (user) => set({ user }),
  setLoading: (isLoading) => set({ isLoading }),

  logout: async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    set({ user: null, token: null, isAuthenticated: false })
  },

  signIn: async (email, password) => {
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) throw error

    const authUser = data.user
    if (!authUser) throw new Error('No se pudo iniciar sesión')

    const appUser = await fetchAppUser(authUser.id)
    if (!appUser) throw new Error('El usuario no está vinculado a una empresa')

    set({
      user: appUser,
      token: data.session?.access_token ?? null,
      isAuthenticated: true,
    })

    return appUser
  },

  loadUser: async () => {
    set({ isLoading: true })
    const supabase = createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      return
    }

    const appUser = await fetchAppUser(authUser.id)
    set({
      user: appUser,
      isAuthenticated: !!appUser,
      isLoading: false,
    })
  },
}))
