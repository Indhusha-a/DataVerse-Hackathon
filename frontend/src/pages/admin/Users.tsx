import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { adminCreateUser, adminDepots, adminUpdateUser, adminUsers, listOutlets } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { errorMessage } from '@/api/client'
import { ROLE_LABEL } from '@/lib/labels'
import type { AdminUser, Role } from '@/api/types'

const ROLES = Object.keys(ROLE_LABEL) as Role[]

export function AdminUsers() {
  const users = useAsync(() => adminUsers(), [])
  const outlets = useAsync(() => listOutlets(), [])
  const depots = useAsync(() => adminDepots(), [])
  const [showForm, setShowForm] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const list = users.data ?? []

  async function change(user: AdminUser, patch: Partial<Pick<AdminUser, 'role' | 'active'>>) {
    setBusy(user.id)
    setError(null)
    try {
      await adminUpdateUser(user.id, { role: patch.role ?? user.role, active: patch.active ?? user.active })
      users.reload()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${list.length} accounts`}
        actions={
          <Button size="sm" icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Close form' : 'New user'}
          </Button>
        }
      />

      {error && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

      {showForm && (
        <CreateUserForm
          depots={depots.data ?? []}
          outlets={outlets.data ?? []}
          onCreated={() => {
            setShowForm(false)
            users.reload()
          }}
        />
      )}

      <Card className="mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Username</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Access</th>
              </tr>
            </thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{u.fullName}</td>
                  <td className="px-4 py-3 text-slate-500">{u.username}</td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      disabled={busy === u.id}
                      onChange={(e) => change(u, { role: e.target.value as Role })}
                      className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs outline-none focus:border-brand-400"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.active ? 'success' : 'neutral'} dot>
                      {u.active ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="ghost" disabled={busy === u.id} onClick={() => change(u, { active: !u.active })}>
                      {u.active ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

function CreateUserForm({
  depots,
  outlets,
  onCreated,
}: {
  depots: { id: string; code: string; name: string; district: string }[]
  outlets: { id: string; outletCode: string }[]
  onCreated: () => void
}) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<Role>('DRIVER')
  const [depotId, setDepotId] = useState<string>(depots[0]?.id ?? '')
  const [outletId, setOutletId] = useState<string>('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!depotId && depots.length > 0) setDepotId(depots[0].id)
  }, [depots, depotId])

  const needsOutlet = role === 'STORE_MANAGER'
  const canSubmit =
    username.trim() && password.length >= 6 && fullName.trim() && (needsOutlet ? !!outletId : true) && !busy

  async function submit() {
    setBusy(true)
    setError(null)
    try {
      await adminCreateUser({
        username: username.trim(),
        password,
        fullName: fullName.trim(),
        role,
        depotId: needsOutlet ? null : depotId || null,
        outletId: needsOutlet ? outletId : null,
      })
      onCreated()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const field = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400'

  return (
    <Card>
      <CardBody className="space-y-4">
        <p className="text-sm font-semibold text-slate-900">New user</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-xs text-slate-500">
            Full name
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={field} />
          </label>
          <label className="text-xs text-slate-500">
            Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} className={field} />
          </label>
          <label className="text-xs text-slate-500">
            Password (at least 6 characters)
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className={field} />
          </label>
          <label className="text-xs text-slate-500">
            Role
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={field}>
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          {needsOutlet ? (
            <label className="text-xs text-slate-500 sm:col-span-2">
              Outlet
              <select value={outletId} onChange={(e) => setOutletId(e.target.value)} className={field}>
                <option value="">Select an outlet</option>
                {outlets.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.outletCode}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="text-xs text-slate-500 sm:col-span-2">
              Depot
              <select value={depotId} onChange={(e) => setDepotId(e.target.value)} className={field}>
                {depots.length === 0 && <option value="">No depot found</option>}
                {depots.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name || d.code} · {d.district}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
        {error && <p role="alert" className="text-sm text-danger-600">{error}</p>}
        <Button onClick={submit} disabled={!canSubmit}>
          {busy ? 'Creating…' : 'Create user'}
        </Button>
      </CardBody>
    </Card>
  )
}
