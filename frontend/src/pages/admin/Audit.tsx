import { useMemo, useState } from 'react'
import { RefreshCw, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { adminAuditLogs } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { ACTION_LABEL, ROLE_LABEL } from '@/lib/labels'
import { formatDateTime } from '@/lib/dates'
import type { AuditLog, Role } from '@/api/types'

const LIMITS = [50, 100, 200] as const

export function AdminAudit() {
  const [limit, setLimit] = useState<(typeof LIMITS)[number]>(100)
  const [query, setQuery] = useState('')
  const logs = useAsync(() => adminAuditLogs(limit), [limit])

  const list = logs.data ?? []
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return list
    return list.filter((row) =>
      [row.action, ACTION_LABEL[row.action], row.role, row.entityType, row.entityId, row.source, row.result]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q)),
    )
  }, [list, query])

  return (
    <div>
      <PageHeader
        title="Audit log"
        subtitle="Every write, sign-in and assistant tool call is recorded here"
        actions={
          <Button
            size="sm"
            variant="secondary"
            disabled={logs.loading}
            icon={<RefreshCw className={logs.loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />}
            onClick={() => logs.reload()}
          >
            {logs.loading ? 'Refreshing…' : 'Refresh'}
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by action, role or entity"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm outline-none focus:border-brand-400"
          />
        </div>
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value) as (typeof LIMITS)[number])}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-400"
        >
          {LIMITS.map((n) => (
            <option key={n} value={n}>
              Latest {n}
            </option>
          ))}
        </select>
      </div>

      {logs.error && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{logs.error}</p>}

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState title={logs.loading ? 'Loading…' : 'No matching entries'} description="Adjust the filter or refresh." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs text-slate-400">
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Entity</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Result</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <AuditRow key={row.id} row={row} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function AuditRow({ row }: { row: AuditLog }) {
  const failed = row.result && row.result !== 'SUCCESS'
  return (
    <tr className="border-b border-slate-50 align-top last:border-0">
      <td className="px-4 py-3 text-xs whitespace-nowrap text-slate-500">{formatDateTime(row.createdAt)}</td>
      <td className="px-4 py-3">
        <p className="font-medium text-slate-800">{ACTION_LABEL[row.action] ?? row.action}</p>
        {ACTION_LABEL[row.action] && <p className="font-mono text-[11px] text-slate-400">{row.action}</p>}
      </td>
      <td className="px-4 py-3 text-slate-500">{row.role ? (ROLE_LABEL[row.role as Role] ?? row.role) : '—'}</td>
      <td className="px-4 py-3 text-xs text-slate-500">
        {row.entityType ?? '—'}
        {row.entityId && <span className="block font-mono text-[11px] text-slate-400">{row.entityId.slice(0, 8)}</span>}
      </td>
      <td className="px-4 py-3 text-slate-500">{row.source ?? '—'}</td>
      <td className="px-4 py-3">
        <Badge tone={failed ? 'danger' : 'success'}>{row.result ?? 'Recorded'}</Badge>
      </td>
    </tr>
  )
}
