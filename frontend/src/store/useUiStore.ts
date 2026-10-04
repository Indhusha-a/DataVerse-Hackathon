import { create } from 'zustand'
import { nextOperatingDay, todayIso } from '@/lib/dates'

// Shared UI state: the operating date every screen works against, the assistant
// and notification panels, the sidebar, and the driver's offline toggle.
interface UiState {
  operatingDate: string
  aiOpen: boolean
  notificationsOpen: boolean
  sidebarCollapsed: boolean
  simulateOffline: boolean
  setOperatingDate: (date: string) => void
  toggleAi: () => void
  closeAi: () => void
  toggleNotifications: () => void
  closeNotifications: () => void
  toggleSidebar: () => void
  toggleSimulateOffline: () => void
}

export const useUiStore = create<UiState>((set) => ({
  operatingDate: nextOperatingDay(todayIso()),
  aiOpen: false,
  notificationsOpen: false,
  sidebarCollapsed: false,
  simulateOffline: false,
  setOperatingDate: (date) => set({ operatingDate: date }),
  toggleAi: () => set((s) => ({ aiOpen: !s.aiOpen, notificationsOpen: false })),
  closeAi: () => set({ aiOpen: false }),
  toggleNotifications: () => set((s) => ({ notificationsOpen: !s.notificationsOpen, aiOpen: false })),
  closeNotifications: () => set({ notificationsOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleSimulateOffline: () => set((s) => ({ simulateOffline: !s.simulateOffline })),
}))
