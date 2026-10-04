import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Drawer } from '@/components/common/Drawer'
import { EmptyState } from '@/components/common/EmptyState'
import { OrderStatusBadge } from '@/components/logistics/StatusBadge'
import { cn } from '@/lib/utils'
import { confirmOrder, createOrder, storeOrders } from '@/api/endpoints'
import { usePolling } from '@/hooks/useAsync'
import { useAuthStore } from '@/store/useAuthStore'
import { errorMessage } from '@/api/client'
import { formatDateTime } from '@/lib/dates'
import { byOrderCodeDesc } from '@/lib/sort'
import type { StoreOrder } from '@/api/types'

type Temp = 'AMBIENT' | 'CHILLED'
interface ItemRow {
  itemName: string
  quantity: number
}

export function StoreOrders() {
  const orders = usePolling(() => storeOrders(), 15000, [])
  const outletId = useAuthStore((s) => s.currentUser?.outletId ?? null)
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const list = byOrderCodeDesc(orders.data ?? [])

  async function confirm(order: StoreOrder) {
    setBusy(order.id)
    setError(null)
    try {
      await confirmOrder(order.id)
      orders.reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Orders"
        subtitle={`${list.length} orders for your outlet`}
        actions={
          <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>
            Place new order
          </Button>
        }
      />

      {error && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

      <Drawer open={showForm} onClose={() => setShowForm(false)} title="New order" subtitle="For your outlet">
        <NewOrderForm
          outletId={outletId}
          onCreated={() => {
            setShowForm(false)
            orders.reload()
          }}
        />
      </Drawer>

      <Card className="mt-5 overflow-hidden">
        {orders.loading && list.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-slate-400">Loading orders…</p>
        ) : list.length === 0 ? (
          <EmptyState
            icon={<Plus className="h-8 w-8" />}
            title="No orders yet"
            description="Place your outlet's first order to start the cycle."
            action={
              <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowForm(true)}>
                Place new order
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Units</th>
                  <th className="px-4 py-3 font-medium">Expected</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-medium text-slate-800">{o.orderCode}</td>
                    <td className="px-4 py-3 text-slate-500">{o.orderUnits}</td>
                    <td className="px-4 py-3 text-slate-500">{o.expectedArrival ? formatDateTime(o.expectedArrival) : 'Not yet planned'}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.status} />
                      {o.deferralReason && <p className="mt-1 text-xs text-danger-600">Deferred: {o.deferralReason}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.status === 'CREATED' && (
                        <Button size="sm" variant="secondary" disabled={busy === o.id} onClick={() => confirm(o)}>
                          {busy === o.id ? 'Confirming…' : 'Confirm'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function NewOrderForm({ outletId, onCreated }: { outletId: string | null; onCreated: () => void }) {
  const [temp, setTemp] = useState<Temp>('AMBIENT')
  const [units, setUnits] = useState(10)
  const [weight, setWeight] = useState(50)
  const [volume, setVolume] = useState(0.5)
  const [items, setItems] = useState<ItemRow[]>([{ itemName: '', quantity: 1 }])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validItems = items.filter((i) => i.itemName.trim() && i.quantity > 0)
  const canSubmit = !!outletId && units > 0 && weight > 0 && volume > 0 && validItems.length > 0 && !busy

  function update(index: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  async function submit() {
    if (!outletId) return
    setBusy(true)
    setError(null)
    try {
      await createOrder({
        outletId,
        tempRequirement: temp,
        orderUnits: units,
        orderWeightKg: weight,
        orderVolumeM3: volume,
        items: validItems.map((i) => ({ itemName: i.itemName.trim(), quantity: i.quantity })),
      })
      onCreated()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const field = 'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400'

  return (
    <div className="space-y-5 p-5">
      <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Temperature</p>
          <div className="grid grid-cols-2 gap-2 sm:w-96">
            {(['AMBIENT', 'CHILLED'] as Temp[]).map((t) => (
              <button
                key={t}
                onClick={() => setTemp(t)}
                className={cn(
                  'rounded-lg border px-3 py-2 text-xs font-semibold',
                  temp === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600',
                )}
              >
                {t === 'AMBIENT' ? 'Ambient' : 'Chilled'}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="text-xs text-slate-500">
            Units
            <input type="number" min={1} value={units} onChange={(e) => setUnits(Number(e.target.value))} className={`mt-1 ${field}`} />
          </label>
          <label className="text-xs text-slate-500">
            Weight (kg)
            <input type="number" min={0} step="0.1" value={weight} onChange={(e) => setWeight(Number(e.target.value))} className={`mt-1 ${field}`} />
          </label>
          <label className="text-xs text-slate-500">
            Volume (m³)
            <input type="number" min={0} step="0.01" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className={`mt-1 ${field}`} />
          </label>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Items</p>
          <div className="space-y-2">
            {items.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={row.itemName}
                  onChange={(e) => update(i, { itemName: e.target.value })}
                  placeholder="Item name"
                  className={field}
                />
                <input
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) => update(i, { quantity: Number(e.target.value) })}
                  className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400"
                />
                <button
                  onClick={() => setItems((rows) => rows.filter((_, idx) => idx !== i))}
                  disabled={items.length === 1}
                  className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <button onClick={() => setItems((rows) => [...rows, { itemName: '', quantity: 1 }])} className="mt-2 text-xs font-medium text-brand-600">
            + Add item
          </button>
        </div>

        {!outletId && <p className="text-sm text-warning-700">This account is not linked to an outlet, so orders cannot be created.</p>}
        {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}

        <Button className="w-full" onClick={submit} disabled={!canSubmit}>
          {busy ? 'Creating…' : 'Create order'}
        </Button>
    </div>
  )
}
