import { useNavigate } from 'react-router-dom'
import { ClipboardList, PackageCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/common/StatCard'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { TripStatusBadge } from '@/components/logistics/StatusBadge'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { loaderTasks } from '@/api/endpoints'
import { usePolling } from '@/hooks/useAsync'
import { formatDate, formatTime } from '@/lib/dates'

export function LoaderDashboard() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const date = useUiStore((s) => s.operatingDate)
  const tasks = usePolling(() => loaderTasks(date), 15000, [date])

  const list = tasks.data ?? []
  const next = list.find((t) => t.status !== 'READY')
  const ready = list.filter((t) => t.status === 'READY').length
  const loading = list.filter((t) => t.status === 'LOADING').length
  const planned = list.filter((t) => t.status === 'PLANNED').length

  return (
    <div>
      <PageHeader title={`Hello, ${currentUser?.fullName.split(' ')[0]}`} subtitle={`Peliyagoda dock · ${formatDate(date)}`} />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Loads today" value={list.length} icon={<ClipboardList className="h-4 w-4" />} />
        <StatCard label="Ready" value={ready} tone="success" />
        <StatCard label="Loading" value={loading} tone="warning" />
        <StatCard label="Waiting" value={planned} />
      </div>

      {next && (
        <Card className="mt-6">
          <CardHeader
            title="Next load"
            subtitle={`Trip ${next.tripNumber} · ${next.vehicleCode} · ${next.stops.length} stops`}
          />
          <CardBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <TripStatusBadge status={next.status} />
                <p className="mt-3 text-sm text-slate-600">
                  First stop {formatTime(next.stops[0]?.plannedArrivalTime)} · last stop {formatTime(next.stops.at(-1)?.plannedArrivalTime)}
                </p>
                <Button className="mt-4" onClick={() => navigate('/loader/tasks')} icon={<PackageCheck className="h-4 w-4" />}>
                  Open loading
                </Button>
              </div>
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-800">Load in this order</p>
                <ol className="mt-2 list-inside list-decimal space-y-1">
                  {next.stops.map((s) => (
                    <li key={s.stopId}>
                      {s.outletCode} · {s.orderCode}
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {!next && !tasks.loading && (
        <Card className="mt-6">
          <CardBody className="py-10 text-center text-sm text-slate-400">No loads are waiting. Loads appear after the dispatcher approves a plan.</CardBody>
        </Card>
      )}
    </div>
  )
}
