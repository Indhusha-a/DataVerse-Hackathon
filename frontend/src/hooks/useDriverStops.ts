import { useMemo } from 'react'
import { driverActiveTrips, driverStops } from '@/api/endpoints'
import type { DriverStop, Trip } from '@/api/types'
import { useSyncQueue, type QueuedEvent } from '@/store/useSyncQueue'
import { useDriverTripStore } from '@/store/useDriverTripStore'
import { loadStops, saveStops } from '@/lib/driverCache'
import { usePolling } from './useAsync'
import { useOnline } from './useOnline'

export interface EffectiveStop extends DriverStop {
  /** The status as the driver sees it, including actions still waiting in the offline queue. */
  shownStatus: DriverStop['deliveryStatus']
  shownUnits: number | null
  queuedNote: string | null
}

export function applyQueue(stops: DriverStop[], queue: QueuedEvent[]): EffectiveStop[] {
  return stops.map((stop) => {
    const pending = queue.filter((e) => e.stopId === stop.stopId && e.status !== 'synced')
    let shownStatus = stop.deliveryStatus
    let shownUnits = stop.deliveredUnits
    let queuedNote: string | null = null
    for (const event of pending) {
      if (event.type === 'DRIVER_ARRIVED' && shownStatus === 'EN_ROUTE') {
        shownStatus = 'ARRIVED'
        queuedNote = 'Arrival queued'
      }
      if (event.type === 'DELIVERY_OUTCOME' && event.outcome) {
        shownStatus = event.outcome
        shownUnits = event.deliveredUnits ?? shownUnits
        queuedNote = 'Outcome queued'
      }
    }
    return { ...stop, shownStatus, shownUnits, queuedNote }
  })
}

/** Resolves which trip this driver is running today. */
export function useActiveTripSelection(date: string) {
  const online = useOnline()
  const trips = usePolling(() => driverActiveTrips(date), online ? 20000 : 0, [date, online])
  const candidates: Trip[] = trips.data ?? []
  const selectedId = useDriverTripStore((s) => s.selected[date])
  const select = useDriverTripStore((s) => s.select)
  const clear = useDriverTripStore((s) => s.clear)

  const valid = candidates.find((t) => t.id === selectedId)
  const tripId = valid ? valid.id : candidates.length === 1 ? candidates[0].id : undefined
  const needsSelection = candidates.length > 1 && !valid

  return {
    candidates,
    tripId,
    needsSelection,
    loading: trips.loading,
    error: trips.error,
    selectTrip: (id: string) => select(date, id),
    clearTrip: () => clear(date),
  }
}

/** The day's stops for the resolved trip. Online it refreshes from the
 * server and caches the result; offline it shows the cache. */
export function useDriverStops(date: string) {
  const online = useOnline()
  const queue = useSyncQueue((s) => s.events)
  const selection = useActiveTripSelection(date)

  const source = usePolling(async () => {
    if (!online) {
      const cached = loadStops(date)
      if (cached) return cached.stops
      throw new Error('You are offline and this route has not been loaded on this device yet.')
    }
    if (selection.needsSelection || !selection.tripId) return []
    const stops = await driverStops(date, selection.tripId)
    saveStops(date, stops)
    return stops
  }, online ? 20000 : 0, [date, online, selection.tripId, selection.needsSelection])

  const effective = useMemo(() => applyQueue(source.data ?? [], queue), [source.data, queue])
  return { ...source, stops: effective, online, ...selection }
}
