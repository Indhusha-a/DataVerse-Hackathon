import { useState } from 'react'
import { AlertTriangle, ChevronDown, PackageCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { TripStatusBadge } from '@/components/logistics/StatusBadge'
import { useUiStore } from '@/store/useUiStore'
import {
  completeLoading,
  loaderTasks,
  loadingEvents,
  reportLoadingIssue,
  startLoading,
} from '@/api/endpoints'
import { useAsync, usePolling } from '@/hooks/useAsync'
import { errorMessage } from '@/api/client'
import { formatDateTime, formatTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { LoadingEvent, Trip } from '@/api/types'

type IssueType = 'SHORTFALL' | 'DAMAGE' | 'OTHER'

export function LoaderTasks() {
  const date = useUiStore((s) => s.operatingDate)
  const tasks = usePolling(() => loaderTasks(date), 15000, [date])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function act(tripId: string, action: () => Promise<unknown>) {
    setBusy(tripId)
    setError(null)
    try {
      await action()
      tasks.reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <PageHeader title="Today's loads" subtitle="Load the stops in the order shown. Report anything missing or damaged before the vehicle leaves." />
      {error && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

      <div className="space-y-3">
        {(tasks.data ?? []).map((trip) => {
          const open = expanded === trip.id
          return (
            <Card key={trip.id} className="overflow-hidden">
              <button onClick={() => setExpanded(open ? null : trip.id)} className="flex w-full items-center justify-between px-5 py-4 text-left">
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Trip {trip.tripNumber} · {trip.vehicleCode}
                  </p>
                  <p className="text-xs text-slate-400">
                    {trip.stops.length} stops · {trip.totalWeightKg.toLocaleString()} kg · {trip.totalVolumeM3} m³
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <TripStatusBadge status={trip.status} />
                  <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
                </div>
              </button>

              {open && (
                <CardBody className="space-y-4 border-t border-slate-100 pt-4">
                  <div className="flex flex-wrap gap-2">
                    {trip.status === 'PLANNED' && (
                      <Button onClick={() => act(trip.id, () => startLoading(trip.id))} disabled={busy === trip.id} icon={<PackageCheck className="h-4 w-4" />}>
                        Start loading
                      </Button>
                    )}
                    {trip.status === 'LOADING' && (
                      <Button variant="success" onClick={() => act(trip.id, () => completeLoading(trip.id))} disabled={busy === trip.id}>
                        Mark loaded
                      </Button>
                    )}
                  </div>

                  <div className="divide-y divide-slate-100 rounded-xl border border-slate-100">
                    {trip.stops.map((s) => (
                      <div key={s.stopId} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {s.sequence}. {s.outletCode}
                          </p>
                          <p className="text-xs text-slate-400">
                            {s.orderCode} · window from {formatTime(s.plannedArrivalTime)}
                          </p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{s.orderStatus}</span>
                      </div>
                    ))}
                  </div>

                  {trip.status !== 'PLANNED' && <IssueForm trip={trip} disabled={busy === trip.id} onReported={tasks.reload} />}
                  <EventLog tripId={trip.id} />
                </CardBody>
              )}
            </Card>
          )
        })}
        {(tasks.data ?? []).length === 0 && !tasks.loading && (
          <Card>
            <CardBody className="py-10 text-center text-sm text-slate-400">No loads for this day yet.</CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}

function IssueForm({ trip, disabled, onReported }: { trip: Trip; disabled: boolean; onReported: () => void }) {
  const [type, setType] = useState<IssueType>('SHORTFALL')
  const [orderId, setOrderId] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function submit() {
    setError(null)
    setSent(false)
    try {
      await reportLoadingIssue(trip.id, { type, orderId: orderId || null, description: description.trim() })
      setDescription('')
      setOrderId('')
      setSent(true)
      onReported()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div className="space-y-2 rounded-xl border border-danger-100 bg-danger-50/40 p-3.5">
      <p className="flex items-center gap-1.5 text-xs font-semibold text-danger-700">
        <AlertTriangle className="h-3.5 w-3.5" /> Report a problem
      </p>
      <div className="flex flex-wrap gap-1.5">
        {(['SHORTFALL', 'DAMAGE', 'OTHER'] as IssueType[]).map((t) => (
          <button
            key={t}
            onClick={() => setType(t)}
            className={cn(
              'rounded-lg border px-2.5 py-1 text-xs font-medium',
              type === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white text-slate-600',
            )}
          >
            {t === 'SHORTFALL' ? 'Shortfall' : t === 'DAMAGE' ? 'Damaged' : 'Other'}
          </button>
        ))}
      </div>
      <select
        value={orderId}
        onChange={(e) => setOrderId(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        <option value="">Whole trip</option>
        {trip.stops.map((s) => (
          <option key={s.stopId} value={s.orderId}>
            {s.orderCode} · {s.outletCode}
          </option>
        ))}
      </select>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What is missing or damaged?"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
      />
      {error && <p className="text-xs text-danger-600">{error}</p>}
      {sent && <p className="text-xs text-success-600">Reported. The dispatcher has been notified.</p>}
      <Button size="sm" variant="secondary" disabled={disabled || !description.trim()} onClick={submit}>
        Report
      </Button>
    </div>
  )
}

function EventLog({ tripId }: { tripId: string }) {
  const events = useAsync<LoadingEvent[]>(() => loadingEvents(tripId), [tripId])
  if (events.loading && !events.data) return <p className="text-xs text-slate-400">Loading events…</p>
  if (!events.data || events.data.length === 0) return null
  return (
    <div>
      <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Loading events</p>
      <ul className="space-y-1 text-xs text-slate-600">
        {events.data.map((e, i) => (
          <li key={i}>
            {formatDateTime(e.at)} · {e.type}
            {e.description ? ` · ${e.description}` : ''}
          </li>
        ))}
      </ul>
    </div>
  )
}
