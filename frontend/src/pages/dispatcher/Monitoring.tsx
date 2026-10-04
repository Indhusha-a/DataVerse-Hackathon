import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { EmptyState } from '@/components/common/EmptyState'
import { TripProgressCard } from '@/components/logistics/TripProgressCard'
import { useUiStore } from '@/store/useUiStore'
import { listTrips, notifications } from '@/api/endpoints'
import { usePolling } from '@/hooks/useAsync'
import { formatDate, formatDateTime } from '@/lib/dates'
import { ACTIVE_TRIP_STATES } from '@/lib/trips'

const STATES: { status: string; label: string }[] = [
  { status: 'PLANNED', label: 'Planned' },
  { status: 'LOADING', label: 'Loading' },
  { status: 'READY', label: 'Ready' },
  { status: 'DISPATCHED', label: 'Dispatched' },
  { status: 'IN_PROGRESS', label: 'In progress' },
  { status: 'COMPLETED', label: 'Completed' },
]

export function DispatcherMonitoring() {
  const date = useUiStore((s) => s.operatingDate)
  const trips = usePolling(() => listTrips(date), 15000, [date])
  const feed = usePolling(() => notifications(), 15000, [])

  const list = trips.data ?? []
  const active = list.filter((t) => ACTIVE_TRIP_STATES.includes(t.status))

  return (
    <div>
      <PageHeader title="Monitoring" subtitle={`Live view for ${formatDate(date)} · refreshes every 15 seconds`} />

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Trips on the road or loading" subtitle={`${active.length} trips`} />
          <CardBody className="grid gap-3 sm:grid-cols-2">
            {active.length === 0 && <EmptyState title="No active trips" description="Trips appear here once they are loading." />}
            {active.map((t) => (
              <TripProgressCard key={t.id} trip={t} />
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Fleet status" subtitle="Trips by state for the day" />
          <CardBody className="space-y-2">
            {STATES.map((s) => (
              <div key={s.status} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span className="text-slate-600">{s.label}</span>
                <span className="font-semibold text-slate-900">{list.filter((t) => t.status === s.status).length}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>

      <Card className="mt-5">
        <CardHeader title="Event feed" subtitle="Latest notices for dispatch, from the live system" />
        <CardBody>
          {(feed.data ?? []).length === 0 && <p className="text-sm text-slate-400">No events yet.</p>}
          <ol className="space-y-0">
            {(feed.data ?? []).slice(0, 25).map((n, i, arr) => (
              <li key={n.id} className="relative flex gap-4 pb-4 last:pb-0">
                {i !== arr.length - 1 && <span className="absolute top-5 left-[107px] h-full w-px bg-slate-200" />}
                <span className="w-24 flex-shrink-0 pt-0.5 text-right text-xs font-medium text-slate-400">{formatDateTime(n.createdAt)}</span>
                <span className="z-10 mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-brand-500" />
                <span className="-mt-0.5 text-sm text-slate-700">{n.message}</span>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>
    </div>
  )
}
