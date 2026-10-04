import { useEffect, useMemo, useState } from 'react'
import { AlertOctagon, CheckCircle2, PackageSearch, RefreshCcw, Route as RouteIcon, Snowflake, Sparkles } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { CapacityBar } from '@/components/common/CapacityBar'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { TripStatusBadge } from '@/components/logistics/StatusBadge'
import { StopList } from '@/components/logistics/RouteTimeline'
import { useUiStore } from '@/store/useUiStore'
import { approvePlan, currentPlan, generatePlan, listOrders, listVehicles, replanPlan } from '@/api/endpoints'
import { ApiError, errorMessage } from '@/api/client'
import { useAsync } from '@/hooks/useAsync'
import { formatDate, formatTime } from '@/lib/dates'
import { byOrderCodeDesc } from '@/lib/sort'
import type { Plan, VehicleResponse } from '@/api/types'

async function loadPlan(date: string): Promise<Plan | null> {
  try {
    return await currentPlan(date)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function DispatcherPlanning() {
  const date = useUiStore((s) => s.operatingDate)
  const plan = useAsync(() => loadPlan(date), [date])
  const vehicles = useAsync(() => listVehicles(), [])
  const orders = useAsync(() => listOrders(), [])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vehicleByCode = new Map<string, VehicleResponse>((vehicles.data ?? []).map((v) => [v.vehicleCode, v]))
  const confirmedOrders = useMemo(
    () => byOrderCodeDesc((orders.data ?? []).filter((o) => o.status === 'CONFIRMED')),
    [orders.data],
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  // Defaults to "everything selected" each time the confirmed-orders list changes,
  // so Generate still plans all of them unless the dispatcher deliberately unchecks some.
  useEffect(() => {
    setSelectedIds(new Set(confirmedOrders.map((o) => o.id)))
  }, [confirmedOrders])

  function toggleOrder(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAll() {
    setSelectedIds((prev) => (prev.size === confirmedOrders.length ? new Set() : new Set(confirmedOrders.map((o) => o.id))))
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true)
    setError(null)
    try {
      await action()
      plan.reload()
      orders.reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const current = plan.data
  const servedStops = current?.trips.reduce((n, t) => n + t.stops.length, 0) ?? 0
  const isEmptyPlan = !!current && current.trips.length === 0 && current.deferred.length === 0

  // One row per order the draft considered: which trip it landed in, or why it was deferred.
  // Built from the plan response already on the page — no extra request.
  const allocationRows = useMemo(() => {
    if (!current) return []
    const rows: { orderCode: string; outletCode: string; outcome: string; tone: 'success' | 'danger'; detail: string }[] = []
    for (const trip of current.trips) {
      for (const stop of trip.stops) {
        rows.push({
          orderCode: stop.orderCode,
          outletCode: stop.outletCode,
          outcome: `Trip ${trip.tripNumber} · ${trip.vehicleCode}`,
          tone: 'success',
          detail: `Stop ${stop.sequence} · planned ${formatTime(stop.plannedArrivalTime)}`,
        })
      }
    }
    for (const d of current.deferred) {
      rows.push({
        orderCode: d.orderCode,
        outletCode: d.outletCode,
        outcome: 'Deferred',
        tone: 'danger',
        detail: d.reasons.join('; '),
      })
    }
    return rows.sort((a, b) => a.orderCode.localeCompare(b.orderCode))
  }, [current])

  return (
    <div>
      <PageHeader
        title="Planning"
        subtitle={`Plan for ${formatDate(date)} · Mon–Sat operations · at most two trips per vehicle per day`}
        actions={
          !current || current.status !== 'DRAFT' ? (
            <Button
              onClick={() => run(() => generatePlan(date, [...selectedIds]))}
              disabled={busy || current?.status === 'DRAFT' || selectedIds.size === 0}
              icon={<Sparkles className="h-4 w-4" />}
            >
              {busy ? 'Planning…' : `Generate draft plan (${selectedIds.size})`}
            </Button>
          ) : null
        }
      />

      {error && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

      {(!current || current.status !== 'DRAFT') && (
        <Card className="mb-5">
          <CardHeader
            title="Orders waiting for a plan"
            subtitle="Confirmed orders this depot's draft will consider when you generate it"
            action={<Badge tone={confirmedOrders.length > 0 ? 'brand' : 'neutral'}>{confirmedOrders.length}</Badge>}
          />
          <CardBody className="p-0">
            {orders.loading && confirmedOrders.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-400">Loading orders…</p>
            ) : confirmedOrders.length === 0 ? (
              <EmptyState icon={<PackageSearch className="h-8 w-8" />} title="No confirmed orders yet" description="Generating now would produce an empty plan." />
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-slate-100 text-xs text-slate-400">
                      <th className="w-10 px-4 py-2.5">
                        <input
                          type="checkbox"
                          checked={selectedIds.size === confirmedOrders.length}
                          onChange={toggleAll}
                          aria-label="Select all orders"
                        />
                      </th>
                      <th className="px-4 py-2.5 font-medium">Order</th>
                      <th className="px-4 py-2.5 font-medium">Outlet</th>
                      <th className="px-4 py-2.5 font-medium">Brand</th>
                      <th className="px-4 py-2.5 font-medium">Units</th>
                      <th className="px-4 py-2.5 font-medium">Temp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {confirmedOrders.map((o) => (
                      <tr key={o.id} className="border-b border-slate-50 last:border-0">
                        <td className="px-4 py-2.5">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(o.id)}
                            onChange={() => toggleOrder(o.id)}
                            aria-label={`Select ${o.orderCode}`}
                          />
                        </td>
                        <td className="px-4 py-2.5 font-medium text-slate-800">{o.orderCode}</td>
                        <td className="px-4 py-2.5 text-slate-500">{o.outletCode}</td>
                        <td className="px-4 py-2.5"><Badge tone="neutral">{o.brand}</Badge></td>
                        <td className="px-4 py-2.5 text-slate-500">{o.orderUnits}</td>
                        <td className="px-4 py-2.5 text-slate-500">
                          {o.tempRequirement === 'CHILLED' ? (
                            <span className="flex items-center gap-1 text-info-600"><Snowflake className="h-3 w-3" /> Chilled</span>
                          ) : (
                            'Ambient'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {plan.loading && !current && <p className="text-sm text-slate-400">Loading plan…</p>}

      {!plan.loading && !current && (
        <Card>
          <CardBody className="py-14 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-slate-300" />
            <p className="mt-3 text-sm text-slate-500">
              No plan exists for {formatDate(date)} yet. Generate a draft to allocate confirmed orders to vehicles and trips.
            </p>
          </CardBody>
        </Card>
      )}

      {current && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryTile label="Plan status" value={current.status === 'DRAFT' ? 'Draft' : 'Approved'} tone={current.status === 'DRAFT' ? 'warning' : 'success'} />
            <SummaryTile label="Trips" value={String(current.trips.length)} />
            <SummaryTile label="Stops served" value={String(servedStops)} tone="success" />
            <SummaryTile label="Deferred" value={String(current.deferred.length)} tone="danger" />
          </div>

          {current.status === 'DRAFT' && (
            <Card className="border-brand-100 bg-brand-50">
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-brand-800">Review the draft, then approve it</p>
                  <p className="mt-1 text-xs text-brand-700">
                    Approving creates the loading tasks and sets orders to allocated. Replanning discards this draft and
                    builds a new one from the current confirmed orders.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => run(() => replanPlan(current.id))} disabled={busy} icon={<RefreshCcw className="h-4 w-4" />}>
                    Replan
                  </Button>
                  <Button variant="success" onClick={() => run(() => approvePlan(current.id))} disabled={busy} icon={<CheckCircle2 className="h-4 w-4" />}>
                    Approve plan
                  </Button>
                </div>
              </CardBody>
            </Card>
          )}

          {isEmptyPlan ? (
            <Card>
              <CardBody>
                <EmptyState
                  icon={<Sparkles className="h-8 w-8" />}
                  title="No orders to plan"
                  description="There were no confirmed orders when this draft was generated. Confirm some orders, then replan."
                />
              </CardBody>
            </Card>
          ) : (
            <>
              <Card>
                <CardHeader title="Allocation result" subtitle="Every order this draft considered, and where it landed" />
                <CardBody className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px] text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-100 text-xs text-slate-400">
                          <th className="px-4 py-3 font-medium">Order</th>
                          <th className="px-4 py-3 font-medium">Outlet</th>
                          <th className="px-4 py-3 font-medium">Outcome</th>
                          <th className="px-4 py-3 font-medium">Detail</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allocationRows.map((row) => (
                          <tr key={row.orderCode} className="border-b border-slate-50 last:border-0">
                            <td className="px-4 py-3 font-medium text-slate-800">{row.orderCode}</td>
                            <td className="px-4 py-3 text-slate-500">{row.outletCode}</td>
                            <td className="px-4 py-3">
                              <Badge tone={row.tone}>{row.outcome}</Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-500">{row.detail}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardBody>
              </Card>

              <div className="grid gap-5 lg:grid-cols-2">
                {current.trips.map((trip) => {
                  const vehicle = vehicleByCode.get(trip.vehicleCode)
                  return (
                    <Card key={trip.id}>
                      <CardHeader
                        title={`Trip ${trip.tripNumber} · ${trip.vehicleCode}`}
                        subtitle={`${trip.brand} · ${trip.district} · ${trip.stops.length} stops · about ${Math.round(trip.plannedDurationMin)} min`}
                        action={<TripStatusBadge status={trip.status} />}
                      />
                      <CardBody className="space-y-4">
                        {vehicle && (
                          <div className="space-y-3">
                            <CapacityBar label="Weight" used={trip.totalWeightKg} total={vehicle.weightCapKg} unit="kg" />
                            <CapacityBar label="Volume" used={trip.totalVolumeM3} total={vehicle.volumeCapM3} unit="m³" />
                            <CapacityBar label="Fuel vs weekly quota" used={trip.fuelLitres} total={vehicle.weeklyFuelQuotaL} unit="L" />
                          </div>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          <Badge tone="neutral">{trip.totalDistanceKm} km route</Badge>
                          {vehicle?.temp === 'REEFER' && <Badge tone="info">Reefer</Badge>}
                        </div>
                        <StopList
                          stops={trip.stops.map((s) => ({
                            stopId: s.stopId,
                            sequence: s.sequence,
                            label: `${s.outletCode} · ${s.orderCode}`,
                            eta: formatTime(s.plannedArrivalTime),
                            done: false,
                            current: false,
                          }))}
                        />
                      </CardBody>
                    </Card>
                  )
                })}
              </div>

              <Card>
                <CardHeader
                  title="Deferred orders"
                  subtitle="Each deferral lists the reasons the planner could not place the order. They are considered first next run."
                />
                <CardBody className="space-y-3">
                  {current.deferred.length === 0 && (
                    <EmptyState icon={<RouteIcon className="h-8 w-8" />} title="Every confirmed order was served" />
                  )}
                  {current.deferred.map((d) => (
                    <div key={d.orderCode} className="rounded-xl border border-danger-100 bg-danger-50 p-3.5">
                      <p className="flex items-center gap-2 text-sm font-semibold text-danger-700">
                        <AlertOctagon className="h-4 w-4" /> {d.orderCode} · {d.outletCode}
                      </p>
                      <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-danger-700">
                        {d.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </CardBody>
              </Card>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function SummaryTile({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const color = { default: 'text-slate-900', success: 'text-success-600', warning: 'text-warning-600', danger: 'text-danger-600' }[tone]
  return (
    <Card className="p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  )
}
