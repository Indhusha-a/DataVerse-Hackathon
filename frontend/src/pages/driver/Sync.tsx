import { CheckCircle2, CloudOff, RefreshCw, AlertTriangle, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { useSyncQueue, type QueuedEvent } from '@/store/useSyncQueue'
import { useOnline } from '@/hooks/useOnline'
import { usePolling } from '@/hooks/useAsync'
import { syncStatus } from '@/api/endpoints'
import { formatDateTime } from '@/lib/dates'

const STATUS_LABEL: Record<QueuedEvent['status'], string> = {
  pending: 'Waiting to sync',
  synced: 'Synced',
  conflict: 'Needs attention',
}

export function DriverSync() {
  const online = useOnline()
  const events = useSyncQueue((s) => s.events)
  const syncing = useSyncQueue((s) => s.syncing)
  const lastSyncedAt = useSyncQueue((s) => s.lastSyncedAt)
  const lastError = useSyncQueue((s) => s.lastError)
  const flush = useSyncQueue((s) => s.flush)
  const clearResolved = useSyncQueue((s) => s.clearResolved)

  const server = usePolling(() => syncStatus(), online ? 15000 : 0, [online])

  const pending = events.filter((e) => e.status === 'pending')
  const conflicts = events.filter((e) => e.status === 'conflict')
  const resolved = events.filter((e) => e.status === 'synced')

  return (
    <div>
      <PageHeader title="Sync" subtitle="Actions recorded on this device" />
      <OfflineBanner />

      <div className="mb-5 grid grid-cols-3 gap-3">
        <Metric label="Waiting" value={pending.length} tone="text-warning-700" />
        <Metric label="Needs attention" value={conflicts.length} tone="text-danger-600" />
        <Metric label="Synced" value={resolved.length} tone="text-success-700" />
      </div>

      <Card className="mb-5">
        <CardBody className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {online ? <CheckCircle2 className="h-5 w-5 text-success-600" /> : <CloudOff className="h-5 w-5 text-slate-400" />}
            <div>
              <p className="text-sm font-semibold text-slate-900">{online ? 'Connected' : 'No connection'}</p>
              <p className="text-xs text-slate-400">
                {lastSyncedAt ? `Last synced ${formatDateTime(lastSyncedAt)}` : 'Not synced in this session yet'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => clearResolved()}
              disabled={resolved.length === 0}
              icon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Clear synced
            </Button>
            <Button
              size="sm"
              onClick={() => flush()}
              disabled={!online || syncing || pending.length === 0}
              icon={<RefreshCw className={syncing ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />}
            >
              {syncing ? 'Syncing…' : 'Sync now'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {lastError && (
        <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">
          Sync failed: {lastError}. Your actions are still saved on this device.
        </p>
      )}

      {events.length === 0 ? (
        <EmptyState title="Nothing to sync" description="Arrivals and deliveries you record while offline appear here." />
      ) : (
        <Card>
          <CardHeader title="Queue" />
          <CardBody className="divide-y divide-slate-100 p-0">
            {[...conflicts, ...pending, ...resolved].map((event) => (
              <div key={event.eventId} className="flex items-start gap-3 px-5 py-3">
                <div className="mt-0.5">
                  {event.status === 'conflict' && <AlertTriangle className="h-4 w-4 text-danger-500" />}
                  {event.status === 'pending' && <CloudOff className="h-4 w-4 text-warning-500" />}
                  {event.status === 'synced' && <CheckCircle2 className="h-4 w-4 text-success-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-900">{event.label}</p>
                  <p className="text-xs text-slate-400">
                    {STATUS_LABEL[event.status]} · recorded {formatDateTime(event.clientTimestamp)}
                  </p>
                  {event.message && <p className="mt-1 text-xs text-danger-600">{event.message}</p>}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      <div className="mt-5">
        <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Office record</p>
        {server.error && <p className="text-sm text-slate-400">Office status unavailable right now.</p>}
        {server.data && (
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Applied by office" value={server.data.synced} tone="text-success-700" />
            <Metric label="Conflicts on server" value={server.data.conflicts} tone="text-danger-600" />
          </div>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <Card>
      <CardBody className="py-4 text-center">
        <p className={`text-2xl font-bold ${tone}`}>{value}</p>
        <p className="mt-1 text-xs text-slate-500">{label}</p>
      </CardBody>
    </Card>
  )
}
