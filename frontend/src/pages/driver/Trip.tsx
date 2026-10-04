import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Navigation2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Card, CardBody } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { StopList } from '@/components/logistics/RouteTimeline'
import { TripStatusBadge } from '@/components/logistics/StatusBadge'
import { OrderClock } from '@/components/logistics/OrderClock'
import { NavigateButton } from '@/components/logistics/NavigateButton'
import { EmptyState } from '@/components/common/EmptyState'
import { useUiStore } from '@/store/useUiStore'
import { driverStartTrip, driverTrip } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { useDriverStops } from '@/hooks/useDriverStops'
import { useOutletDistricts } from '@/hooks/useOutletDistricts'
import { useOnline } from '@/hooks/useOnline'
import { ApiError, errorMessage } from '@/api/client'
import { formatTime } from '@/lib/dates'
import type { Trip } from '@/api/types'

async function loadTripOrNull(date: string, tripId: string | undefined): Promise<Trip | null> {
  try {
    return await driverTrip(date, tripId)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

const SETTLED = ['DELIVERED', 'PARTIAL', 'FAILED', 'RECEIPT_CONFIRMED']

export function DriverTrip() {
  const navigate = useNavigate()
  const date = useUiStore((s) => s.operatingDate)
  const online = useOnline()
  const { stops, tripId, needsSelection } = useDriverStops(date)
  const trip = useAsync(() => (online && tripId ? loadTripOrNull(date, tripId) : Promise.resolve(null)), [date, online, tripId])
  const districts = useOutletDistricts()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (needsSelection) {
    return (
      <div>
        <PageHeader title="My trip" />
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

  const current = stops.find((s) => !SETTLED.includes(s.shownStatus))

  async function start() {
    if (!trip.data) return
    setBusy(true)
    setError(null)
    try {
      await driverStartTrip(trip.data.id)
      trip.reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="My trip"
        subtitle={trip.data ? `Trip ${trip.data.tripNumber} · ${trip.data.vehicleCode} · ${trip.data.district}` : 'Today'}
      />
      <OfflineBanner />

      {trip.data && (
        <Card className="mb-5">
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TripStatusBadge status={trip.data.status} />
              <span className="text-sm text-slate-500">
                {trip.data.stops.length} stops · about {Math.round(trip.data.plannedDurationMin)} min
              </span>
            </div>
            {trip.data.status === 'DISPATCHED' && (
              <Button onClick={start} disabled={busy || !online} size="lg">
                {busy ? 'Starting…' : 'Start trip'}
              </Button>
            )}
            {trip.data.status === 'IN_PROGRESS' && (
              <span className="text-sm font-medium text-success-600">Trip underway</span>
            )}
          </CardBody>
        </Card>
      )}

      {error && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

      {current && (
        <Card className="mb-5 border-brand-200 bg-brand-50">
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-brand-600">Next stop</p>
              <p className="text-base font-bold text-brand-800">
                {current.sequence}. {current.outletCode}
              </p>
              <p className="text-xs text-brand-600">Planned {formatTime(current.plannedArrivalTime)}</p>
              <div className="mt-2">
                <OrderClock date={date} time={current.windowClose} />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <NavigateButton outletCode={current.outletCode} district={districts[current.outletCode]} className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100" />
              <Button size="sm" icon={<Navigation2 className="h-3.5 w-3.5" />} onClick={() => navigate('/driver/stops')}>
                Open stops
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardBody>
          <StopList
            stops={stops.map((s) => ({
              stopId: s.stopId,
              sequence: s.sequence,
              label: `${s.outletCode} · ${s.orderCode}`,
              eta: formatTime(s.plannedArrivalTime),
              done: SETTLED.includes(s.shownStatus),
              current: current?.stopId === s.stopId,
            }))}
          />
        </CardBody>
      </Card>
    </div>
  )
}
