import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/database'
import { supabase } from '@/lib/supabase'
import { useSubscriptionStore } from '@/stores/subscriptionStore'

interface AuthState {
  session: Session | null
  user: User | null
  profile: UserProfile | null
  initialized: boolean
  initialize: () => Promise<void>
  setProfile: (profile: UserProfile | null) => void
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  initialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    set({ session, user: session?.user ?? null })

    if (session?.user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      set({ profile: data })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      set({ session, user: session?.user ?? null })
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
        set({ profile: data })
      } else {
        set({ profile: null })
      }
    })

    set({ initialized: true })
  },

  setProfile: (profile) => set({ profile }),

  signOut: async () => {
    await supabase.auth.signOut()
    useSubscriptionStore.getState().reset()
    set({ session: null, user: null, profile: null })
  },
}))
