import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Card, CardBody } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { DeliveryStatusBadge } from '@/components/logistics/StatusBadge'
import { OrderClock } from '@/components/logistics/OrderClock'
import { NavigateButton } from '@/components/logistics/NavigateButton'
import { useUiStore } from '@/store/useUiStore'
import { useSyncQueue } from '@/store/useSyncQueue'
import { useDriverStops } from '@/hooks/useDriverStops'
import { useOutletDistricts } from '@/hooks/useOutletDistricts'
import { driverArrive } from '@/api/endpoints'
import { errorMessage } from '@/api/client'
import { formatTime } from '@/lib/dates'

export function DriverStops() {
  const navigate = useNavigate()
  const date = useUiStore((s) => s.operatingDate)
  const { stops, error, loading, online, needsSelection } = useDriverStops(date)
  const districts = useOutletDistricts()
  const enqueue = useSyncQueue((s) => s.enqueue)
  const [busy, setBusy] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function arrive(stop: (typeof stops)[number]) {
    setBusy(stop.stopId)
    setActionError(null)
    try {
      if (online) {
        await driverArrive(stop.stopId)
      } else {
        enqueue({
          type: 'DRIVER_ARRIVED',
          stopId: stop.stopId,
          label: `Arrived at ${stop.outletCode}`,
        })
      }
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  if (needsSelection) {
    return (
      <div>
        <PageHeader title="Stops" />
        <EmptyState
          title="Pick your vehicle first"
          description="More than one trip is active today. Go to Today and select which one you're driving."
          action={
            <Button size="sm" onClick={() => navigate('/driver/dashboard')}>
              Go to Today
            </Button>
          }
        />
      </div>
    )
  }

  return (
    <div>
      <PageHeader title="Stops" subtitle={stops.length ? `${stops.length} stops on today's route` : 'Your stop list'} />
      <OfflineBanner />

      {error && <p role="alert" className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700">{error}</p>}
      {actionError && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{actionError}</p>}
      {!loading && stops.length === 0 && !error && <p className="text-sm text-slate-400">No stops are assigned to you for this day.</p>}

      {stops.length > 0 && stops.every((s) => s.shownStatus === 'PENDING') && (
        <EmptyState
          title="The trip hasn't started yet"
          description="Stops become actionable once you start the trip. Go to My Trip and tap Start trip."
          action={
            <Button size="sm" onClick={() => navigate('/driver/trip')}>
              Go to My Trip
            </Button>
          }
        />
      )}

      <div className="space-y-3">
        {stops.map((stop) => (
          <Card key={stop.stopId} className={stop.shownStatus === 'ARRIVED' ? 'border-brand-300 ring-2 ring-brand-100' : undefined}>
            <CardBody>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {stop.sequence}. {stop.outletCode}
                  </p>
                  <p className="text-xs text-slate-400">
                    {stop.orderCode} · {stop.orderUnits} units
                  </p>
                </div>
                <DeliveryStatusBadge status={stop.shownStatus} />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span>Planned {formatTime(stop.plannedArrivalTime)}</span>
                <span>Window closes {formatTime(stop.windowClose)}</span>
                {stop.windowRisk === 'LATE' && <span className="font-medium text-danger-600">Arrived after the window</span>}
                {stop.queuedNote && <span className="font-medium text-warning-600">{stop.queuedNote}</span>}
              </div>

              {!['DELIVERED', 'PARTIAL', 'FAILED', 'RECEIPT_CONFIRMED'].includes(stop.shownStatus) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <OrderClock date={date} time={stop.windowClose} />
                  <NavigateButton outletCode={stop.outletCode} district={districts[stop.outletCode]} />
                </div>
              )}

              {stop.routeNote && <p className="mt-2 text-xs text-brand-700">{stop.routeNote}</p>}

              {stop.shownStatus === 'EN_ROUTE' && (
                <Button className="mt-3 w-full" size="sm" disabled={busy === stop.stopId} onClick={() => arrive(stop)}>
                  {busy === stop.stopId ? 'Recording…' : online ? 'Arrived at stop' : 'Arrived (queued)'}
                </Button>
              )}
              {stop.shownStatus === 'ARRIVED' && (
                <Button className="mt-3 w-full" size="sm" onClick={() => navigate('/driver/delivery')}>
                  Record delivery
                </Button>
              )}
              {['DELIVERED', 'PARTIAL', 'FAILED', 'RECEIPT_CONFIRMED'].includes(stop.shownStatus) && (
                <p className="mt-3 text-xs font-medium text-success-600">
                  {stop.shownUnits ?? 0} of {stop.orderUnits} units handed over
                </p>
              )}
              {stop.shownStatus === 'PENDING' && (
                <button onClick={() => navigate('/driver/trip')} className="mt-3 text-xs font-medium text-brand-600 hover:underline">
                  Waiting for the trip to start — go to My Trip
                </button>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  )
}
