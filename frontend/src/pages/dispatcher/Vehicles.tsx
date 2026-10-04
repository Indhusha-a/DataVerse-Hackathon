import { useMemo, useState } from 'react'
import { Snowflake, Truck as TruckIcon } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { EmptyState } from '@/components/common/EmptyState'
import { cn } from '@/lib/utils'
import { useUiStore } from '@/store/useUiStore'
import { listTrips, listVehicles } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { formatDate } from '@/lib/dates'
import type { Trip } from '@/api/types'

const FILTERS = ['All', 'Refrigerated', 'Ambient', 'Vans', 'Trucks'] as const
type Filter = (typeof FILTERS)[number]

export function DispatcherVehicles() {
  const date = useUiStore((s) => s.operatingDate)
  const vehicles = useAsync(() => listVehicles(), [])
  const trips = useAsync(() => listTrips(date), [date])
  const [filter, setFilter] = useState<Filter>('All')

  const tripsByVehicle = useMemo(() => {
    const map = new Map<string, Trip[]>()
    for (const t of trips.data ?? []) {
      if (t.status === 'CANCELLED') continue
      map.set(t.vehicleCode, [...(map.get(t.vehicleCode) ?? []), t])
    }
    return map
  }, [trips.data])

  const list = (vehicles.data ?? []).filter((v) => {
    switch (filter) {
      case 'Refrigerated':
        return v.temp === 'REEFER'
      case 'Ambient':
        return v.temp === 'AMBIENT'
      case 'Vans':
        return v.type === 'VAN'
      case 'Trucks':
        return v.type === 'TRUCK'
      default:
        return true
    }
  })

  return (
    <div>
      <PageHeader title="Vehicles" subtitle={`Fleet for ${formatDate(date)} · ${vehicles.data?.length ?? 0} vehicles`} />

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

      {list.length === 0 ? (
        <EmptyState icon={<TruckIcon className="h-8 w-8" />} title="No vehicles match this filter" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => {
            const planned = tripsByVehicle.get(v.vehicleCode) ?? []
            return (
              <Card key={v.id}>
                <CardBody>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                        <TruckIcon className="h-4.5 w-4.5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{v.vehicleCode}</p>
                        <p className="text-xs text-slate-400 capitalize">
                          {v.type.toLowerCase()} · {v.depotCode}
                        </p>
                      </div>
                    </div>
                    <Badge tone={planned.length >= 2 ? 'warning' : 'neutral'}>Trips {planned.length}/2</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {v.temp === 'REEFER' && (
                      <Badge tone="info">
                        <Snowflake className="mr-1 h-3 w-3" />
                        Reefer
                      </Badge>
                    )}
                    <Badge tone="neutral">{v.weightCapKg.toLocaleString()} kg</Badge>
                    <Badge tone="neutral">{v.volumeCapM3} m³</Badge>
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>
                      <dt>Weekly fuel quota</dt>
                      <dd className="font-medium text-slate-800">{v.weeklyFuelQuotaL} L</dd>
                    </div>
                    <div>
                      <dt>Fuel economy</dt>
                      <dd className="font-medium text-slate-800">{v.kmPerL} km/L</dd>
                    </div>
                  </dl>

                  {planned.length > 0 && (
                    <ul className="mt-4 space-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
                      {planned.map((t) => (
                        <li key={t.id}>
                          Trip {t.tripNumber} · {t.brand} · {t.district} · {t.stops.length} stops
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
