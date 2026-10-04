import { useNavigate } from 'react-router-dom'
import { AlertTriangle, PackageSearch, Route as RouteIcon, Truck, Fuel } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { TripProgressCard } from '@/components/logistics/TripProgressCard'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { dispatcherAlerts, dispatcherKpis, listTrips } from '@/api/endpoints'
import { usePolling } from '@/hooks/useAsync'
import { formatDate } from '@/lib/dates'
import { alertTone } from '@/lib/alerts'

export function DispatcherDashboard() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const date = useUiStore((s) => s.operatingDate)

  const kpis = usePolling(() => dispatcherKpis(date), 15000, [date])
  const trips = usePolling(() => listTrips(date), 15000, [date])
  const alerts = usePolling(() => dispatcherAlerts(), 30000, [])

  const k = kpis.data
  const active = (trips.data ?? []).filter((t) => ['LOADING', 'READY', 'DISPATCHED', 'IN_PROGRESS'].includes(t.status))

  return (
    <div>
      <PageHeader
        title={`Hello, ${currentUser?.fullName.split(' ')[0]}`}
        subtitle={`Operations for ${formatDate(date)} · Peliyagoda`}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Orders today" value={k?.ordersToday ?? '—'} icon={<PackageSearch className="h-4 w-4" />} />
        <StatCard label="Served" value={k?.ordersServed ?? '—'} tone="success" />
        <StatCard label="Deferred" value={k?.ordersDeferred ?? '—'} tone="danger" />
        <StatCard label="Vehicles out" value={k?.vehiclesActive ?? '—'} icon={<Truck className="h-4 w-4" />} />
        <StatCard label="Active trips" value={k?.tripsActive ?? '—'} icon={<RouteIcon className="h-4 w-4" />} />
        <StatCard label="Late risk stops" value={k?.lateRiskStops ?? '—'} tone="warning" />
      </div>

      {k && (
        <Card className="mt-4">
          <CardBody className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm text-slate-600">
            <span className="flex items-center gap-2">
              <Fuel className="h-4 w-4 text-slate-400" /> Planned fuel {k.fuelPlannedLitres} L
            </span>
            <span>
              Share of weekly fuel quotas in use: <strong className="text-slate-900">{k.fuelUtilizationPct}%</strong>
            </span>
          </CardBody>
        </Card>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Live operations"
            subtitle={`${active.length} trips loading, ready or on the road`}
            action={
              <button onClick={() => navigate('/dispatcher/monitoring')} className="text-xs font-medium text-brand-600 hover:underline">
                Monitoring →
              </button>
            }
          />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {active.length === 0 && (
              <EmptyState
                icon={<RouteIcon className="h-8 w-8" />}
                title="No trips in progress"
                description="Approve a plan on the Planning screen to create today's trips."
              />
            )}
            {active.map((trip) => (
              <TripProgressCard key={trip.id} trip={trip} onClick={() => navigate('/dispatcher/trips')} />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Priority alerts" subtitle="Needs dispatcher attention" />
          <CardBody className="space-y-3 p-3">
            {(alerts.data ?? []).length === 0 && <p className="px-2 py-6 text-center text-sm text-slate-400">Nothing needs attention.</p>}
            {(alerts.data ?? []).slice(0, 8).map((a, i) => {
              const tone = alertTone(a.severity)
              return (
                <div key={`${a.type}-${i}`} className="flex gap-3 rounded-xl p-2.5 hover:bg-slate-50">
                  <span className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${tone.className}`}>
                    <AlertTriangle className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800">{tone.label(a.type)}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{a.message}</p>
                  </div>
                </div>
              )
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
