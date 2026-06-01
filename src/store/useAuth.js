import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuth = create(persist(
  (set) => ({
    user: null,
    token: null,
    login: (user, token) => set({ user, token }),
    logout: () => set({ user: null, token: null }),
    updateUser: (user) => set(s => ({ user: { ...s.user, ...user } })),
  }),
  { name: 'sv-auth' }
))

export default useAuth
