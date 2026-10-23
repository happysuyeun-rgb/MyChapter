import { create } from 'zustand'
import type { Session, User } from '@supabase/supabase-js'
import type { UserProfile } from '@/types/database'
import {
  DEV_MOCK_PROFILE,
  DEV_MOCK_PROJECT,
  DEV_MOCK_SESSION,
  DEV_MOCK_USER,
  isDevBypass,
} from '@/lib/devBypass'
import { removeAllDeviceTokens } from '@/lib/api/deviceTokens'
import { resetPushState } from '@/lib/push'
import { supabase } from '@/lib/supabase'
import { useProjectStore } from '@/stores/projectStore'
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

let initPromise: Promise<void> | null = null

function applyMockAuth(set: (partial: Partial<AuthState>) => void) {
  set({
    session: DEV_MOCK_SESSION,
    user: DEV_MOCK_USER,
    profile: DEV_MOCK_PROFILE,
    initialized: true,
  })
  useSubscriptionStore.getState().setPlan('pro')
  useProjectStore.getState().setActiveProject(DEV_MOCK_PROJECT)
}

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  initialized: false,

  initialize: async () => {
    if (isDevBypass()) {
      applyMockAuth(set)
      return
    }

    if (get().initialized) return

    if (initPromise) {
      await initPromise
      return
    }

    initPromise = (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        set({ session, user: session?.user ?? null })

        if (session?.user) {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle()
          // Keep session even if profile fetch fails; Splash/guards handle null nickname.
          if (!error) set({ profile: data })
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (isDevBypass()) return

          set({ session, user: session?.user ?? null })
          if (session?.user) {
            const { data, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle()
            if (!error) set({ profile: data })
          } else {
            set({ profile: null })
          }
        })
      } finally {
        set({ initialized: true })
      }
    })()

    try {
      await initPromise
    } finally {
      initPromise = null
    }
  },

  setProfile: (profile) => set({ profile }),

  signOut: async () => {
    if (isDevBypass()) {
      applyMockAuth(set)
      return
    }

    const userId = get().user?.id
    if (userId) {
      try {
        await removeAllDeviceTokens(userId)
      } catch (err) {
        console.error('Failed to clear device tokens on sign out:', err)
      }
    }
    resetPushState()

    await supabase.auth.signOut()
    useSubscriptionStore.getState().reset()
    useProjectStore.getState().setActiveProject(null)
    set({ session: null, user: null, profile: null })
  },
}))
