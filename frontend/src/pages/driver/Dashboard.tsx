import { useNavigate } from 'react-router-dom'
import { ArrowRight, Navigation2, Truck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Card, CardBody } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { DeliveryStatusBadge } from '@/components/logistics/StatusBadge'
import { OrderClock } from '@/components/logistics/OrderClock'
import { NavigateButton } from '@/components/logistics/NavigateButton'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { useDriverStops } from '@/hooks/useDriverStops'
import { useOutletDistricts } from '@/hooks/useOutletDistricts'
import { formatTime } from '@/lib/dates'

const SETTLED = ['DELIVERED', 'PARTIAL', 'FAILED', 'RECEIPT_CONFIRMED']

export function DriverDashboard() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const date = useUiStore((s) => s.operatingDate)
  const { stops, error, loading, candidates, tripId, needsSelection, selectTrip, clearTrip } = useDriverStops(date)
  const districts = useOutletDistricts()

  const done = stops.filter((s) => SETTLED.includes(s.shownStatus)).length
  const next = stops.find((s) => !SETTLED.includes(s.shownStatus))
  const currentTrip = candidates.find((t) => t.id === tripId)

  return (
    <div>
      <PageHeader title={`Hi, ${currentUser?.fullName.split(' ')[0]}`} subtitle="Your route for the day" />
      <OfflineBanner />

      {error && <p role="alert" className="mb-4 rounded-lg bg-warning-50 px-3 py-2 text-sm text-warning-700">{error}</p>}

      {needsSelection && (
        <Card className="mb-5 border-brand-200 bg-brand-50">
          <CardBody>
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-brand-800">
              <Truck className="h-4 w-4" /> More than one vehicle is out today — which one are you driving?
            </p>
            <div className="space-y-2">
              {candidates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectTrip(t.id)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-brand-400"
                >
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">{t.vehicleCode}</span>
                    <span className="block text-xs text-slate-500">
                      {t.brand} · {t.district} · {t.stops.length} stops
                    </span>
                  </span>
                  <Badge tone="brand">Select</Badge>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {!needsSelection && currentTrip && (
        <div className="mb-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Truck className="h-4 w-4 text-slate-400" /> Vehicle {currentTrip.vehicleCode}
          </span>
          {candidates.length > 1 && (
            <button onClick={clearTrip} className="text-xs font-medium text-brand-600 hover:underline">
              Not your vehicle?
            </button>
          )}
        </div>
      )}

      {stops.length === 0 && !loading && !error && !needsSelection && (
        <Card>
          <CardBody className="py-10 text-center text-sm text-slate-400">
            No trip has been dispatched to you for this day yet.
          </CardBody>
        </Card>
      )}

      {stops.length > 0 && (
        <>
          <Card className="bg-navy-950 text-white">
            <CardBody className="text-center">
              <p className="text-xs tracking-widest text-slate-400 uppercase">Route</p>
              <p className="mt-1 text-3xl font-bold">
                {done} of {stops.length} stops
              </p>
              <p className="mt-2 text-sm text-slate-300">{stops.length - done} still to visit</p>
            </CardBody>
          </Card>

          {next && (
            <Card className="mt-5">
              <CardBody>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Next stop</p>
                  <DeliveryStatusBadge status={next.shownStatus} />
                </div>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {next.sequence}. {next.outletCode}
                </p>
                <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
                  <span>Planned arrival</span>
                  <span className="font-semibold text-slate-900">{formatTime(next.plannedArrivalTime)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-sm text-slate-500">
                  <span>Window closes</span>
                  <span className="font-semibold text-slate-900">{formatTime(next.windowClose)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <OrderClock date={date} time={next.windowClose} />
                  <NavigateButton outletCode={next.outletCode} district={districts[next.outletCode]} />
                </div>
                <Button className="mt-4 w-full" size="lg" icon={<Navigation2 className="h-4 w-4" />} onClick={() => navigate('/driver/stops')}>
                  Go to stops
                </Button>
              </CardBody>
            </Card>
          )}

          <button
            onClick={() => navigate('/driver/trip')}
            className="mt-4 flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700"
          >
            View full route <ArrowRight className="h-4 w-4 text-slate-400" />
          </button>
        </>
      )}
    </div>
  )
}
