import { useState } from 'react'
import { AlertTriangle, CheckCircle2, PackageOpen } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/common/Badge'
import { DeliveryStatusBadge } from '@/components/logistics/StatusBadge'
import { storeOrders, storeReceive } from '@/api/endpoints'
import { usePolling } from '@/hooks/useAsync'
import { errorMessage } from '@/api/client'
import { byOrderCodeDesc } from '@/lib/sort'
import type { StoreOrder } from '@/api/types'

const AWAITING = ['DELIVERED', 'PARTIAL']

export function StoreTracking() {
  const orders = usePolling(() => storeOrders(), 15000, [])
  const list = byOrderCodeDesc(orders.data ?? [])
  const awaiting = list.filter((o) => AWAITING.includes(o.deliveryStatus ?? '') && o.receivedUnits === null)
  const received = list.filter((o) => o.receivedUnits !== null)

  return (
    <div>
      <PageHeader title="Receive goods" subtitle="Confirm what arrived at your outlet" />

      {awaiting.length === 0 && !orders.loading && (
        <EmptyState
          icon={<PackageOpen className="h-8 w-8" />}
          title="Nothing waiting to be received"
          description="Deliveries appear here once the driver records them as delivered or partial."
        />
      )}

      <div className="space-y-3">
        {awaiting.map((order) => (
          <ReceiveCard key={order.id} order={order} onReceived={() => orders.reload()} />
        ))}
      </div>

      {received.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">Received</p>
          <Card>
            <CardBody className="divide-y divide-slate-100 p-0">
              {received.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{o.orderCode}</p>
                    <p className="text-xs text-slate-400">
                      {o.receivedUnits} of {o.orderUnits} units received
                    </p>
                  </div>
                  {o.discrepancy ? (
                    <Badge tone="warning">Discrepancy</Badge>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-medium text-success-600">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Matched
                    </span>
                  )}
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  )
}

function ReceiveCard({ order, onReceived }: { order: StoreOrder; onReceived: () => void }) {
  const expected = order.deliveredUnits ?? order.orderUnits
  const [units, setUnits] = useState(expected)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const short = units < expected

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await storeReceive(order.id, { receivedUnits: units, notes: notes.trim() || null })
      onReceived()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardBody>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-900">{order.orderCode}</p>
            <p className="text-xs text-slate-400">Driver handed over {expected} of {order.orderUnits} units</p>
          </div>
          <DeliveryStatusBadge status={order.deliveryStatus ?? 'DELIVERED'} />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-[160px_1fr]">
          <label className="text-xs text-slate-500">
            Units received
            <input
              type="number"
              min={0}
              max={expected}
              value={units}
              onChange={(e) => setUnits(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </label>
          <label className="text-xs text-slate-500">
            Notes
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={short ? 'Explain the shortfall' : 'Optional'}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
            />
          </label>
        </div>

        {short && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-warning-700">
            <AlertTriangle className="h-3.5 w-3.5" /> {expected - units} units short. This is recorded as a discrepancy.
          </p>
        )}
        {error && <p role="alert" className="mt-3 text-sm text-danger-600">{error}</p>}

        <Button className="mt-4" disabled={busy || units < 0 || units > expected} onClick={submit}>
          {busy ? 'Saving…' : 'Confirm receipt'}
        </Button>
      </CardBody>
    </Card>
  )
}
