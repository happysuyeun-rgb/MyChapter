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
  profileError: boolean
  initialized: boolean
  initialize: () => Promise<void>
  reloadProfile: () => Promise<void>
  setProfile: (profile: UserProfile | null) => void
  signOut: () => Promise<void>
}

let initPromise: Promise<void> | null = null

async function fetchProfile(userId: string) {
  return supabase.from('users').select('*').eq('id', userId).maybeSingle()
}

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
  profileError: false,
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
          const { data, error } = await fetchProfile(session.user.id)
          // Keep session even if profile fetch fails; Splash shows a retry instead of nickname onboarding.
          if (error) set({ profileError: true })
          else set({ profile: data, profileError: false })
        }

        supabase.auth.onAuthStateChange(async (_event, session) => {
          if (isDevBypass()) return

          set({ session, user: session?.user ?? null })
          if (session?.user) {
            const { data, error } = await fetchProfile(session.user.id)
            if (error) set({ profileError: true })
            else set({ profile: data, profileError: false })
          } else {
            set({ profile: null, profileError: false })
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

  reloadProfile: async () => {
    const userId = get().user?.id
    if (!userId || isDevBypass()) return
    const { data, error } = await fetchProfile(userId)
    if (error) set({ profileError: true })
    else set({ profile: data, profileError: false })
  },

  setProfile: (profile) => set({ profile, profileError: false }),

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
    set({ session: null, user: null, profile: null, profileError: false })
  },
}))
