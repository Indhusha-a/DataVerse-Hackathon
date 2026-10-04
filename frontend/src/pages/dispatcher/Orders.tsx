import { useMemo, useState } from 'react'
import { PackageSearch, Snowflake } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { Drawer } from '@/components/common/Drawer'
import { EmptyState } from '@/components/common/EmptyState'
import { OrderStatusBadge } from '@/components/logistics/StatusBadge'
import { EventTimeline } from '@/components/logistics/RouteTimeline'
import { cn } from '@/lib/utils'
import { byOrderCodeDesc } from '@/lib/sort'
import { deferOrder, listOrders, orderHistory } from '@/api/endpoints'
import { useAsync, usePolling } from '@/hooks/useAsync'
import { errorMessage } from '@/api/client'
import type { DomainEvent, Order, OrderStatus } from "@/api/types"

const FILTERS = ['All', 'Confirmed', 'Deferred', 'Planned', 'In transit', 'Delivered'] as const
type Filter = (typeof FILTERS)[number]

const FILTER_STATUSES: Record<Exclude<Filter, 'All'>, OrderStatus[]> = {
  Confirmed: ['CONFIRMED'],
  Deferred: ['DEFERRED'],
  Planned: ['PLANNED', 'ALLOCATED', 'LOADED'],
  'In transit': ['IN_TRANSIT'],
  Delivered: ['DELIVERED', 'RECEIVED', 'CLOSED'],
}

export function DispatcherOrders() {
  const orders = usePolling(() => listOrders(), 15000, [])
  const [filter, setFilter] = useState<Filter>('All')
  const [selected, setSelected] = useState<Order | null>(null)

  const list = useMemo(() => byOrderCodeDesc(orders.data ?? []), [orders.data])
  const filtered = useMemo(
    () => (filter === 'All' ? list : list.filter((o) => FILTER_STATUSES[filter].includes(o.status))),
    [filter, list],
  )

  return (
    <div>
      <PageHeader title="Orders" subtitle={`${list.length} orders for this depot`} />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'flex-shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors',
              filter === f ? 'bg-navy-950 text-white' : 'bg-white text-slate-600 hover:bg-slate-100',
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <Card className="overflow-hidden">
        {orders.loading && list.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Loading orders…</p>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<PackageSearch className="h-8 w-8" />} title="No orders in this view" description="Try a different filter." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Outlet</th>
                  <th className="px-4 py-3 font-medium">Brand</th>
                  <th className="px-4 py-3 font-medium">Units</th>
                  <th className="px-4 py-3 font-medium">Temperature</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} onClick={() => setSelected(o)} className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{o.orderCode}</td>
                    <td className="px-4 py-3 text-slate-600">{o.outletCode}</td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{o.brand}</Badge>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{o.orderUnits}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {o.tempRequirement === 'CHILLED' ? (
                        <span className="flex items-center gap-1 text-info-600">
                          <Snowflake className="h-3 w-3" /> Chilled
                        </span>
                      ) : (
                        'Ambient'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <OrderDrawer
        order={selected}
        onClose={() => setSelected(null)}
        onChanged={() => {
          orders.reload()
          setSelected(null)
        }}
      />
    </div>
  )
}

function OrderDrawer({ order, onClose, onChanged }: { order: Order | null; onClose: () => void; onChanged: () => void }) {
  const history = useAsync(() => (order ? orderHistory(order.id) : Promise.resolve([] as DomainEvent[])), [order?.id])
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submitDefer() {
    if (!order || !reason.trim()) return
    setBusy(true)
    setError(null)
    try {
      await deferOrder(order.id, reason.trim())
      setReason('')
      onChanged()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Drawer open={!!order} onClose={onClose} title={order?.orderCode ?? ''} subtitle={order?.outletCode}>
      {order && (
        <div className="space-y-5 p-5">
          <div className="flex flex-wrap gap-2">
            <OrderStatusBadge status={order.status} />
            <Badge tone="neutral">{order.brand}</Badge>
            {order.tempRequirement === 'CHILLED' && <Badge tone="info">Chilled</Badge>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <Info label="Units" value={String(order.orderUnits)} />
            <Info label="Weight / volume" value={`${order.orderWeightKg} kg · ${order.orderVolumeM3} m³`} />
          </div>

          {order.deferralReason && (
            <div className="rounded-xl border border-danger-100 bg-danger-50 p-3.5">
              <p className="text-xs font-semibold text-danger-700">Deferral reason</p>
              <p className="mt-1 text-sm text-danger-700">{order.deferralReason}</p>
            </div>
          )}

          {order.status === 'CONFIRMED' && (
            <div className="space-y-2 rounded-xl border border-slate-200 p-3.5">
              <p className="text-xs font-semibold text-slate-600">Defer this order</p>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason, for the store manager's notice"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
              />
              {error && <p className="text-xs text-danger-600">{error}</p>}
              <Button size="sm" variant="secondary" disabled={busy || !reason.trim()} onClick={submitDefer}>
                Defer order
              </Button>
            </div>
          )}

          <div>
            <p className="mb-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">History</p>
            {history.loading ? <p className="text-sm text-slate-400">Loading…</p> : <EventTimeline events={history.data ?? []} />}
          </div>
        </div>
      )}
    </Drawer>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  )
}
