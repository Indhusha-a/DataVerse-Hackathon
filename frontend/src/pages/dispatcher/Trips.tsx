import { useState } from 'react'
import { ChevronDown, Send } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { TripStatusBadge } from '@/components/logistics/StatusBadge'
import { StopList } from '@/components/logistics/RouteTimeline'
import { useUiStore } from '@/store/useUiStore'
import { dispatchTrip, listTrips } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { errorMessage } from '@/api/client'
import { formatDate, formatTime } from '@/lib/dates'
import { cn } from '@/lib/utils'

const SETTLED = ['DELIVERED', 'RECEIVED', 'CLOSED']

export function DispatcherTrips() {
  const date = useUiStore((s) => s.operatingDate)
  const trips = useAsync(() => listTrips(date), [date])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function dispatch(id: string) {
    setBusy(id)
    setError(null)
    try {
      await dispatchTrip(id)
      trips.reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const list = trips.data ?? []

  return (
    <div>
      <PageHeader title="Trips" subtitle={`${list.length} trips for ${formatDate(date)}`} />
      {error && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

      {list.length === 0 && !trips.loading && (
        <EmptyState title="No trips for this day" description="Approve a plan on the Planning screen to create trips." />
      )}

      <div className="space-y-3">
        {list.map((trip) => {
          const open = expanded === trip.id
          const settled = trip.stops.filter((s) => SETTLED.includes(s.orderStatus)).length
          return (
            <Card key={trip.id} className="overflow-hidden">
              <div className="flex items-center justify-between gap-3 px-5 py-4">
                <button onClick={() => setExpanded(open ? null : trip.id)} className="flex min-w-0 flex-1 items-center justify-between text-left">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      Trip {trip.tripNumber} · {trip.vehicleCode}
                    </p>
                    <p className="truncate text-xs text-slate-400">
                      {trip.brand} · {trip.district} · {trip.stops.length} stops · {settled} settled
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <TripStatusBadge status={trip.status} />
                    <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
                  </div>
                </button>
                {trip.status === 'READY' && (
                  <Button size="sm" onClick={() => dispatch(trip.id)} disabled={busy === trip.id} icon={<Send className="h-3.5 w-3.5" />}>
                    {busy === trip.id ? 'Dispatching…' : 'Dispatch'}
                  </Button>
                )}
              </div>
              {open && (
                <CardBody className="border-t border-slate-100 pt-4">
                  <StopList
                    stops={trip.stops.map((s) => ({
                      stopId: s.stopId,
                      sequence: s.sequence,
                      label: `${s.outletCode} · ${s.orderCode}`,
                      eta: `planned ${formatTime(s.plannedArrivalTime)}`,
                      done: SETTLED.includes(s.orderStatus),
                      current: !SETTLED.includes(s.orderStatus) && s.sequence === trip.stops.find((x) => !SETTLED.includes(x.orderStatus))?.sequence,
                    }))}
                  />
                </CardBody>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
