import { useState } from 'react'
import { Database, RotateCcw, Sprout } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { adminHealth, adminResetDemo, adminSeedDemo } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { errorMessage } from '@/api/client'

export function AdminOverview() {
  const health = useAsync(() => adminHealth(), [])
  const [busy, setBusy] = useState<'reset' | 'seed' | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(kind: 'reset' | 'seed') {
    const warning =
      kind === 'reset'
        ? 'Reset clears all orders, plans, trips and events, then reloads the reference data. Continue?'
        : 'Run the demo seeder now?'
    if (!window.confirm(warning)) return
    setBusy(kind)
    setError(null)
    setMessage(null)
    try {
      if (kind === 'reset') await adminResetDemo()
      else await adminSeedDemo()
      setMessage(kind === 'reset' ? 'Demo data was reset.' : 'Demo scenario loaded.')
      health.reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const entries = Object.entries(health.data ?? {})

  return (
    <div>
      <PageHeader title="System overview" subtitle="Service health and demo data controls" />

      {health.error && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{health.error}</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Health" subtitle="Reported by the backend" />
          <CardBody>
            {health.loading && !health.data && <p className="text-sm text-slate-400">Checking…</p>}
            <dl className="divide-y divide-slate-100">
              {entries.map(([key, value]) => (
                <div key={key} className="flex items-center justify-between py-2.5 text-sm">
                  <dt className="text-slate-500">{key}</dt>
                  <dd className="font-medium text-slate-900">{String(value)}</dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Demo data" subtitle="Used for the live walkthrough" />
          <CardBody className="space-y-3">
            <p className="text-sm text-slate-500">
              Seeding runs the backend demo seeder. Reset deletes orders, plans, trips, deliveries and sync events.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" icon={<Sprout className="h-4 w-4" />} disabled={busy !== null} onClick={() => run('seed')}>
                {busy === 'seed' ? 'Loading…' : 'Load demo scenario'}
              </Button>
              <Button variant="danger" icon={<RotateCcw className="h-4 w-4" />} disabled={busy !== null} onClick={() => run('reset')}>
                {busy === 'reset' ? 'Resetting…' : 'Reset data'}
              </Button>
            </div>
            {message && <p className="text-sm text-success-700">{message}</p>}
            {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}
            <p className="flex items-center gap-1.5 pt-2 text-xs text-slate-400">
              <Database className="h-3.5 w-3.5" /> Users, reference data and the audit log are kept on reset.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
