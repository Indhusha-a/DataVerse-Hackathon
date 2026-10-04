import type { DriverStop } from '@/api/types'

// The last stop list fetched for a day, kept on the device so the route is still
// readable when the connection drops mid-route.
const KEY = 'waypoint.driverStops'

interface CachedStops {
  date: string
  savedAt: string
  stops: DriverStop[]
}

export function saveStops(date: string, stops: DriverStop[]) {
  try {
    const payload: CachedStops = { date, savedAt: new Date().toISOString(), stops }
    localStorage.setItem(KEY, JSON.stringify(payload))
  } catch {
    // Storage unavailable: the route simply won't be cached.
  }
}

export function loadStops(date: string): CachedStops | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedStops
    return cached.date === date ? cached : null
  } catch {
    return null
  }
}
