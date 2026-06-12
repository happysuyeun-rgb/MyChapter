import { create } from 'zustand'

interface PaywallState {
  isOpen: boolean
  pendingAction: (() => void) | null
  showPaywall: (action?: () => void) => void
  closePaywall: () => void
  completePurchase: () => void
}

export const usePaywallStore = create<PaywallState>((set, get) => ({
  isOpen: false,
  pendingAction: null,

  showPaywall: (action) =>
    set({ isOpen: true, pendingAction: action ?? null }),

  closePaywall: () =>
    set({ isOpen: false, pendingAction: null }),

  completePurchase: () => {
    const pending = get().pendingAction
    set({ isOpen: false, pendingAction: null })
    pending?.()
  },
}))
