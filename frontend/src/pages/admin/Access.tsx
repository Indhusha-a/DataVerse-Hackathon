import { ShieldCheck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { NAV_ITEMS } from '@/components/layout/navConfig'
import { ROLE_LABEL } from '@/lib/labels'
import type { Role } from '@/api/types'

const ROLES = Object.keys(ROLE_LABEL) as Role[]

const SCOPE: Record<Role, string> = {
  DISPATCHER: 'Depot-wide. Plans, approves and dispatches trips.',
  LOADER: 'Depot-wide. Loads trips and reports loading issues.',
  DRIVER: 'Own trip only. Starts the trip, arrives at stops and records deliveries.',
  STORE_MANAGER: 'Own outlet only. Creates orders and confirms receipt of goods.',
  ADMIN: 'System-wide. Manages users, fleet, demo data and the audit log.',
}

export function AdminAccess() {
  return (
    <div>
      <PageHeader title="Access" subtitle="What each role can see and do" />

      <div className="grid gap-5 md:grid-cols-2">
        {ROLES.map((role) => (
          <Card key={role}>
            <CardHeader title={ROLE_LABEL[role]} subtitle={SCOPE[role]} />
            <CardBody>
              <p className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">Screens</p>
              <ul className="flex flex-wrap gap-1.5">
                {NAV_ITEMS[role].map((item) => (
                  <li key={item.to}>
                    <Badge tone="neutral">{item.label}</Badge>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card className="mt-5">
        <CardBody className="flex items-start gap-3 text-sm text-slate-600">
          <ShieldCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
          <p>
            Screens outside a role's list are hidden in the interface, and the API checks the role on every request.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}
