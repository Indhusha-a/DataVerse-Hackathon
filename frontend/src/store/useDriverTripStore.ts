import { create } from 'zustand'

const KEY = 'waypoint.driverTrip'

function load(): Record<string, string> {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Record<string, string>) : {}
  } catch {
    return {}
  }
}

function save(map: Record<string, string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map))
  } catch {
    // storage unavailable — selection just won't survive a reload
  }
}

interface DriverTripState {
  selected: Record<string, string>
  select: (date: string, tripId: string) => void
  clear: (date: string) => void
}

/** Which vehicle/trip this driver picked, per operating date. */
export const useDriverTripStore = create<DriverTripState>((set, get) => ({
  selected: load(),
  select: (date, tripId) => {
    const next = { ...get().selected, [date]: tripId }
    save(next)
    set({ selected: next })
  },
  clear: (date) => {
    const next = { ...get().selected }
    delete next[date]
    save(next)
    set({ selected: next })
  },
}))
