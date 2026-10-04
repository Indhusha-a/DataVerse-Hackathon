import { useState } from 'react'
import { AlertOctagon, CalendarClock, ChevronDown } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { useUiStore } from '@/store/useUiStore'
import { currentPlan, listOrders } from '@/api/endpoints'
import { ApiError } from '@/api/client'
import { useAsync, usePolling } from '@/hooks/useAsync'
import { cn } from '@/lib/utils'
import { byOrderCodeDesc } from '@/lib/sort'
import type { Plan } from '@/api/types'

async function loadPlanOrNull(date: string): Promise<Plan | null> {
  try {
    return await currentPlan(date)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export function DispatcherDeferred() {
  const date = useUiStore((s) => s.operatingDate)
  const orders = usePolling(() => listOrders(), 15000, [])
  const plan = useAsync(() => loadPlanOrNull(date), [date])
  const [expanded, setExpanded] = useState(false)

  const deferred = byOrderCodeDesc((orders.data ?? []).filter((o) => o.status === 'DEFERRED'))
  const reasonsByCode = new Map((plan.data?.deferred ?? []).map((d) => [d.orderCode, d.reasons]))

  return (
    <div>
      <PageHeader title="Deferred orders" subtitle="Orders the planner could not place, with the reasons" />

      <Card className="mb-6 border-danger-100 bg-danger-50">
        <button onClick={() => setExpanded((v) => !v)} className="flex w-full items-center gap-3 p-4 text-left">
          <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-danger-100 text-danger-600">
            <AlertOctagon className="h-4.5 w-4.5" />
          </span>
          <p className="flex-1 text-sm font-medium text-danger-800">
            {deferred.length} order{deferred.length === 1 ? '' : 's'} deferred.{' '}
            <span className="font-normal text-danger-600">Why this matters</span>
          </p>
          <ChevronDown className={cn('h-4 w-4 flex-shrink-0 text-danger-500 transition-transform', expanded && 'rotate-180')} />
        </button>
        {expanded && (
          <CardBody className="pt-0">
            <p className="max-w-3xl text-sm leading-relaxed text-danger-700">
              When demand exceeds the fleet the dispatcher must decide which orders move to the next run, and record why.
              Each reason below comes from a specific rule: capacity, temperature, van access, the delivery window, the daily
              time budget or the weekly fuel quota. A store manager receives the same reason when an order is deferred.
            </p>
          </CardBody>
        )}
      </Card>

      {deferred.length === 0 && !orders.loading && (
        <EmptyState title="No deferred orders" description="Every confirmed order has been placed on a trip." />
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {deferred.map((o) => {
          const reasons = reasonsByCode.get(o.orderCode)
          return (
            <Card key={o.id}>
              <CardBody>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{o.orderCode}</p>
                    <p className="text-xs text-slate-500">{o.outletCode} · {o.orderUnits} units</p>
                  </div>
                  <div className="flex flex-shrink-0 flex-wrap justify-end gap-1.5">
                    <Badge tone="neutral">{o.tempRequirement === 'CHILLED' ? 'Chilled' : 'Ambient'}</Badge>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Deferral reason</p>
                  {reasons && reasons.length > 0 ? (
                    <ul className="mt-1 list-inside list-disc space-y-0.5 text-sm text-slate-700">
                      {reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-slate-700">{o.deferralReason ?? 'Recorded by dispatcher.'}</p>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Considered first in the next plan
                </div>
              </CardBody>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
