import { create } from 'zustand'
import { syncEvents } from '@/api/endpoints'
import { errorMessage } from '@/api/client'

// Driver actions recorded while offline. Each carries a client-generated event id,
// so replaying the queue is idempotent on the server.

export type QueuedType = 'DRIVER_ARRIVED' | 'DELIVERY_OUTCOME'

export interface QueuedEvent {
  eventId: string
  type: QueuedType
  stopId: string
  label: string
  outcome?: 'DELIVERED' | 'PARTIAL' | 'FAILED'
  deliveredUnits?: number
  podReference?: string | null
  reason?: string | null
  notes?: string | null
  clientTimestamp: string
  status: 'pending' | 'synced' | 'conflict'
  message?: string
}

const KEY = 'waypoint.syncQueue'

function load(): QueuedEvent[] {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as QueuedEvent[]) : []
  } catch {
    return []
  }
}

function save(events: QueuedEvent[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(events.slice(-200)))
  } catch {
    // Quota exceeded or storage disabled: the queue stays in memory for this session.
  }
}

interface SyncQueueState {
  events: QueuedEvent[]
  lastSyncedAt: string | null
  syncing: boolean
  lastError: string | null
  enqueue: (event: Omit<QueuedEvent, 'eventId' | 'clientTimestamp' | 'status'>) => void
  flush: () => Promise<void>
  clearResolved: () => void
}

export const useSyncQueue = create<SyncQueueState>((set, get) => ({
  events: load(),
  lastSyncedAt: null,
  syncing: false,
  lastError: null,

  enqueue: (event) => {
    const next: QueuedEvent = {
      ...event,
      eventId: crypto.randomUUID(),
      clientTimestamp: new Date().toISOString(),
      status: 'pending',
    }
    const events = [...get().events, next]
    save(events)
    set({ events })
  },

  flush: async () => {
    if (get().syncing) return
    const pending = get().events.filter((e) => e.status === 'pending')
    if (pending.length === 0) return

    set({ syncing: true, lastError: null })
    try {
      const payload = pending.map((e) => ({
        eventId: e.eventId,
        type: e.type,
        stopId: e.stopId,
        outcome: e.outcome ?? null,
        deliveredUnits: e.deliveredUnits ?? null,
        podReference: e.podReference ?? null,
        reason: e.reason ?? null,
        notes: e.notes ?? null,
        clientTimestamp: e.clientTimestamp,
      }))
      const results = await syncEvents(payload)
      const byId = new Map(results.map((r) => [r.eventId, r]))
      const events = get().events.map((e) => {
        const result = byId.get(e.eventId)
        if (!result) return e
        return {
          ...e,
          status: result.status === 'SYNCED' ? ('synced' as const) : ('conflict' as const),
          message: result.message,
        }
      })
      save(events)
      set({ events, lastSyncedAt: new Date().toISOString() })
    } catch (error) {
      set({ lastError: errorMessage(error) })
    } finally {
      set({ syncing: false })
    }
  },

  clearResolved: () => {
    const events = get().events.filter((e) => e.status === 'pending' || e.status === 'conflict')
    save(events)
    set({ events })
  },
}))
