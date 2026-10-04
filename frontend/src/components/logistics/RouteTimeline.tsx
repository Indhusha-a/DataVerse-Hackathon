import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDateTime } from '@/lib/dates'
import type { DomainEvent } from '@/api/types'
import { ACTION_LABEL } from '@/lib/labels'

/** Chronological timeline of state transitions from the backend history. */
export function EventTimeline({ events }: { events: DomainEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-slate-400">No events recorded yet.</p>
  }
  return (
    <ol className="space-y-0">
      {events.map((e, i) => (
        <li key={e.id} className="relative flex gap-3 pb-5 last:pb-0">
          {i !== events.length - 1 && <span className="absolute top-5 left-[11px] h-full w-px bg-slate-200" />}
          <span
            className={cn(
              'z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full',
              i === events.length - 1 ? 'bg-brand-600 text-white' : 'bg-success-500 text-white',
            )}
          >
            <Check className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-slate-800">{describe(e)}</p>
            <p className="text-xs text-slate-400">
              {formatDateTime(e.createdAt)}
              {e.previousState && e.newState ? ` · ${e.previousState} → ${e.newState}` : ''}
            </p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function describe(event: DomainEvent): string {
  const label = ACTION_LABEL[event.eventType]
  if (label) return label
  return event.eventType
    .toLowerCase()
    .split('_')
    .map((word, i) => (i === 0 ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ')
}

export interface TimelineStop {
  stopId: string
  sequence: number
  label: string
  eta: string
  done: boolean
  current: boolean
}

/** Stop sequence with progress markers, used on trip and route screens. */
export function StopList({ stops }: { stops: TimelineStop[] }) {
  return (
    <ol className="space-y-0">
      {stops.map((s, i) => (
        <li key={s.stopId} className="relative flex gap-3 pb-5 last:pb-0">
          {i !== stops.length - 1 && <span className="absolute top-5 left-[11px] h-full w-px bg-slate-200" />}
          <span
            className={cn(
              'z-10 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
              s.done && 'bg-success-500 text-white',
              s.current && 'bg-brand-600 text-white ring-4 ring-brand-100',
              !s.done && !s.current && 'bg-slate-200 text-slate-500',
            )}
          >
            {s.done ? <Check className="h-3.5 w-3.5" /> : s.sequence}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className={cn('text-sm font-medium', !s.done && !s.current ? 'text-slate-500' : 'text-slate-800')}>
                {s.label}
              </p>
              <span className="text-xs text-slate-400">{s.eta}</span>
            </div>
          </div>
        </li>
      ))}
    </ol>
  )
}
