import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { OfflineBanner } from '@/components/layout/OfflineBanner'
import { Card, CardBody } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { useUiStore } from '@/store/useUiStore'
import { useSyncQueue } from '@/store/useSyncQueue'
import { useDriverStops, type EffectiveStop } from '@/hooks/useDriverStops'
import { driverRecordDelivery } from '@/api/endpoints'
import { errorMessage } from '@/api/client'
import { cn } from '@/lib/utils'

type Outcome = 'DELIVERED' | 'PARTIAL' | 'FAILED'

const REASONS = ['Store closed', 'Store refused the goods', 'Short delivery', 'Damaged item', 'Access problem']

export function DriverDelivery() {
  const navigate = useNavigate()
  const date = useUiStore((s) => s.operatingDate)
  const { stops, online } = useDriverStops(date)
  const enqueue = useSyncQueue((s) => s.enqueue)

  const arrived = stops.find((s) => s.shownStatus === 'ARRIVED')
  const enRoute = stops.find((s) => s.shownStatus === 'EN_ROUTE')

  const [saved, setSaved] = useState<{ outlet: string; queued: boolean; outcome: Outcome } | null>(null)

  if (saved) {
    return (
      <div>
        <PageHeader title="Delivery recorded" />
        <Card className="border-success-200 bg-success-50">
          <CardBody className="flex flex-col items-center py-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-success-600" />
            <p className="mt-3 text-base font-semibold text-success-800">
              {saved.outlet}: {saved.outcome.toLowerCase()}
            </p>
            <p className="mt-1 text-sm text-success-700">
              {saved.queued ? 'Saved on this device. It will sync when the connection returns.' : 'Synced to the office.'}
            </p>
            <div className="mt-5 flex gap-2">
              <Button variant="secondary" onClick={() => setSaved(null)}>
                Back to form
              </Button>
              <Button onClick={() => navigate('/driver/stops')}>Next stop</Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  if (!arrived) {
    return (
      <div>
        <PageHeader title="Record delivery" />
        <OfflineBanner />
        {enRoute ? (
          <EmptyState
            title={`Arrive at ${enRoute.outletCode} first`}
            description="Mark the arrival on the Stops screen, then record what was handed over."
            action={<Button onClick={() => navigate('/driver/stops')}>Go to stops</Button>}
          />
        ) : (
          <EmptyState title="No stop is waiting for a delivery record" description="Arrive at a stop to record its outcome here." />
        )}
      </div>
    )
  }

  return (
    <DeliveryForm
      key={arrived.stopId}
      stop={arrived}
      online={online}
      onSaved={(outcome, queued) => setSaved({ outlet: arrived.outletCode, outcome, queued })}
      enqueue={enqueue}
    />
  )
}

function DeliveryForm({
  stop,
  online,
  onSaved,
  enqueue,
}: {
  stop: EffectiveStop
  online: boolean
  onSaved: (outcome: Outcome, queued: boolean) => void
  enqueue: ReturnType<typeof useSyncQueue.getState>['enqueue']
}) {
  const [outcome, setOutcome] = useState<Outcome>('DELIVERED')
  const [units, setUnits] = useState<number>(stop.orderUnits)
  const [reason, setReason] = useState('')
  const [pod, setPod] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (outcome === 'DELIVERED') setUnits(stop.orderUnits)
    if (outcome === 'FAILED') setUnits(0)
    if (outcome === 'PARTIAL') setUnits(Math.max(1, stop.orderUnits - 1))
  }, [outcome, stop.orderUnits])

  const needsReason = outcome !== 'DELIVERED'
  const unitsError =
    outcome === 'DELIVERED' && units !== stop.orderUnits
      ? `All ${stop.orderUnits} units must be handed over for a full delivery.`
      : outcome === 'PARTIAL' && (units <= 0 || units >= stop.orderUnits)
        ? `A partial delivery is between 1 and ${stop.orderUnits - 1} units.`
        : outcome === 'FAILED' && units !== 0
          ? 'A failed delivery hands over 0 units.'
          : null
  const canSubmit = !busy && !unitsError && (!needsReason || reason.trim().length > 0)

  async function submit() {
    setBusy(true)
    setError(null)
    const body = {
      stopId: stop.stopId,
      outcome,
      deliveredUnits: units,
      podReference: pod.trim() || null,
      reason: needsReason ? reason.trim() : null,
      notes: notes.trim() || null,
    }
    try {
      if (online) {
        await driverRecordDelivery(body)
        onSaved(outcome, false)
      } else {
        enqueue({
          type: 'DELIVERY_OUTCOME',
          stopId: stop.stopId,
          label: `${stop.outletCode}: ${outcome.toLowerCase()}`,
          outcome,
          deliveredUnits: units,
          podReference: body.podReference,
          reason: body.reason,
          notes: body.notes,
        })
        onSaved(outcome, true)
      }
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <PageHeader title="Record delivery" subtitle={`${stop.sequence}. ${stop.outletCode} · ${stop.orderCode} · ${stop.orderUnits} units`} />
      <OfflineBanner />

      <Card>
        <CardBody className="space-y-5">
          <div>
            <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Outcome</p>
            <div className="grid grid-cols-3 gap-2">
              {(['DELIVERED', 'PARTIAL', 'FAILED'] as Outcome[]).map((o) => (
                <button
                  key={o}
                  onClick={() => setOutcome(o)}
                  className={cn(
                    'rounded-lg border px-3 py-2.5 text-xs font-semibold',
                    outcome === o ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600',
                  )}
                >
                  {o === 'DELIVERED' ? 'Delivered' : o === 'PARTIAL' ? 'Partial' : 'Not delivered'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="units" className="mb-2 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Units handed over
            </label>
            <input
              id="units"
              type="number"
              min={0}
              value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
            />
            {unitsError && <p className="mt-1.5 text-xs text-danger-600">{unitsError}</p>}
          </div>

          {needsReason && (
            <div>
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Reason</p>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setReason(r)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-xs',
                      reason === r ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600',
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe what happened"
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
          )}

          <div>
            <label htmlFor="pod" className="mb-2 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Proof of delivery
            </label>
            <input
              id="pod"
              value={pod}
              onChange={(e) => setPod(e.target.value)}
              placeholder="Signature or photo reference, e.g. receipt-0042.jpg"
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
            />
            <p className="mt-1.5 text-xs text-slate-400">A reference to the signed form or photo. The file itself is not uploaded.</p>
          </div>

          <div>
            <label htmlFor="notes" className="mb-2 block text-xs font-semibold tracking-wide text-slate-400 uppercase">
              Notes
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-brand-400"
            />
          </div>

          {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}

          <Button className="w-full" size="lg" disabled={!canSubmit} onClick={submit}>
            {busy ? 'Saving…' : online ? 'Save delivery' : 'Save on this device'}
          </Button>
        </CardBody>
      </Card>
    </div>
  )
}
