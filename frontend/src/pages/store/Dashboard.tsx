import { Link } from 'react-router-dom'
import { ArrowRight, Clock, PackageCheck, Truck, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { StatCard } from '@/components/common/StatCard'
import { EmptyState } from '@/components/common/EmptyState'
import { OrderStatusBadge } from '@/components/logistics/StatusBadge'
import { storeSummary } from '@/api/endpoints'
import { usePolling } from '@/hooks/useAsync'
import { useAuthStore } from '@/store/useAuthStore'
import { formatTime } from '@/lib/dates'

export function StoreDashboard() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const summary = usePolling(() => storeSummary(), 30000, [])

  const data = summary.data
  return (
    <div>
      <PageHeader
        title={`Hi, ${currentUser?.fullName.split(' ')[0] ?? ''}`}
        subtitle="Your outlet's orders and deliveries for today"
        actions={
          <Link to="/store/orders" className="inline-flex items-center gap-1.5 rounded-lg bg-navy-950 px-3.5 py-2 text-sm font-medium text-white hover:bg-navy-800">
            New order <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {summary.error && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{summary.error}</p>}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Orders today" value={data?.ordersToday ?? '—'} icon={<PackageCheck className="h-4 w-4" />} />
        <StatCard label="In transit" value={data?.inTransit ?? '—'} icon={<Truck className="h-4 w-4" />} tone="default" />
        <StatCard label="Delivered" value={data?.delivered ?? '—'} icon={<PackageCheck className="h-4 w-4" />} tone="success" />
        <StatCard
          label="At risk of late"
          value={data?.lateRiskOrders ?? '—'}
          icon={<AlertTriangle className="h-4 w-4" />}
          tone={data && data.lateRiskOrders > 0 ? 'warning' : 'default'}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Expected arrivals" subtitle="Vehicles on the way to your outlet" />
          <CardBody>
            {data && data.inTransitEtas.length === 0 && (
              <EmptyState icon={<Clock className="h-8 w-8" />} title="Nothing on the road" description="Deliveries appear here once a trip is dispatched." />
            )}
            <ul className="divide-y divide-slate-100">
              {data?.inTransitEtas.map((e) => (
                <li key={e.orderCode} className="flex items-center justify-between py-3 text-sm">
                  <span className="font-medium text-slate-800">{e.orderCode}</span>
                  <span className="text-slate-500">ETA {formatTime(e.eta)}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Recent orders" action={<Link to="/store/tracking" className="text-xs font-medium text-brand-600">Receive goods</Link>} />
          <CardBody>
            {data && data.recentOrders.length === 0 && <p className="py-6 text-center text-sm text-slate-400">No orders yet.</p>}
            <ul className="divide-y divide-slate-100">
              {data?.recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{o.orderCode}</p>
                    <p className="text-xs text-slate-400">{o.orderUnits} units{o.discrepancy ? ' · discrepancy recorded' : ''}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
