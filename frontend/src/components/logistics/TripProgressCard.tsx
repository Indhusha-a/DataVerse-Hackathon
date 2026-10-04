import { Truck } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTime } from '@/lib/dates'
import type { Trip } from '@/api/types'
import { TripStatusBadge } from './StatusBadge'

const SETTLED = ['DELIVERED', 'RECEIVED', 'CLOSED']

export function TripProgressCard({ trip, onClick }: { trip: Trip; onClick?: () => void }) {
  const total = trip.stops.length
  const done = trip.stops.filter((s) => SETTLED.includes(s.orderStatus)).length
  const currentSeq = trip.stops.find((s) => !SETTLED.includes(s.orderStatus))?.sequence
  const pct = total === 0 ? 0 : Math.round((done / total) * 100)

  return (
    <button
      onClick={onClick}
      className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <Truck className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Trip {trip.tripNumber} · {trip.vehicleCode}
            </p>
            <p className="text-xs text-slate-400">
              {trip.brand} · {trip.district} · first stop {formatTime(trip.stops[0]?.plannedArrivalTime)}
            </p>
          </div>
        </div>
        <TripStatusBadge status={trip.status} />
      </div>

      <div className="mt-3.5 flex items-center gap-1.5">
        {trip.stops.map((s) => (
          <span
            key={s.stopId}
            className={cn(
              'h-1.5 flex-1 rounded-full',
              SETTLED.includes(s.orderStatus) && 'bg-success-500',
              s.sequence === currentSeq && 'bg-brand-500',
              !SETTLED.includes(s.orderStatus) && s.sequence !== currentSeq && 'bg-slate-200',
            )}
          />
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>
          {done} of {total} stops settled
        </span>
        <span className="font-medium text-slate-600">{pct}%</span>
      </div>
    </button>
  )
}
