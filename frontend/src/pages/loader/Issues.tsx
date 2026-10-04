import { AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { useUiStore } from '@/store/useUiStore'
import { loaderTasks, loadingEvents } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { formatDateTime } from '@/lib/dates'
import type { LoadingEvent } from '@/api/types'

const ISSUE_TYPES = ['SHORTFALL', 'DAMAGE', 'OTHER']

interface IssueRow extends LoadingEvent {
  tripLabel: string
}

export function LoaderIssues() {
  const date = useUiStore((s) => s.operatingDate)
  const issues = useAsync<IssueRow[]>(async () => {
    const trips = await loaderTasks(date)
    const perTrip = await Promise.all(
      trips.map(async (trip) => {
        const events = await loadingEvents(trip.id).catch(() => [] as LoadingEvent[])
        return events
          .filter((e) => ISSUE_TYPES.includes(e.type))
          .map((e) => ({ ...e, tripLabel: `Trip ${trip.tripNumber} · ${trip.vehicleCode}` }))
      }),
    )
    return perTrip.flat().sort((a, b) => (a.at < b.at ? 1 : -1))
  }, [date])

  const rows = issues.data ?? []

  return (
    <div>
      <PageHeader title="Loading issues" subtitle="Shortfalls, damage and other problems reported while loading today" />

      {rows.length === 0 && !issues.loading ? (
        <EmptyState icon={<AlertTriangle className="h-8 w-8" />} title="No issues reported" description="Everything loaded so far matches the plan." />
      ) : (
        <div className="space-y-3">
          {rows.map((row, i) => (
            <Card key={`${row.at}-${i}`} className={row.type === 'SHORTFALL' ? 'border-danger-100' : 'border-warning-100'}>
              <CardBody className="flex items-start gap-3">
                <span
                  className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${
                    row.type === 'SHORTFALL' ? 'bg-danger-50 text-danger-600' : 'bg-warning-50 text-warning-600'
                  }`}
                >
                  <AlertTriangle className="h-4.5 w-4.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-slate-900">{row.tripLabel}</p>
                    <Badge tone={row.type === 'SHORTFALL' ? 'danger' : 'warning'}>{row.type.toLowerCase()}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">{row.description ?? 'No description given.'}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {formatDateTime(row.at)} · the dispatcher was notified when this was reported
                  </p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
