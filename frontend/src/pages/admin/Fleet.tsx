import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { adminCreateVehicle, adminDeleteVehicle, adminDepots, adminUpdateVehicle, listVehicles } from '@/api/endpoints'
import { useAsync } from '@/hooks/useAsync'
import { errorMessage } from '@/api/client'
import type { Depot, VehicleResponse } from '@/api/types'

interface VehicleForm {
  vehicleCode: string
  type: 'TRUCK' | 'VAN'
  temp: 'REEFER' | 'AMBIENT'
  weightCapKg: number
  volumeCapM3: number
  fuelType: string
  kmPerL: number
  weeklyFuelQuotaL: number
  depotCode: string
}

const EMPTY: VehicleForm = {
  vehicleCode: '',
  type: 'TRUCK',
  temp: 'AMBIENT',
  weightCapKg: 1000,
  volumeCapM3: 10,
  fuelType: 'Diesel',
  kmPerL: 6,
  weeklyFuelQuotaL: 200,
  depotCode: '',
}

const field = 'mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-400'

export function AdminFleet() {
  const vehicles = useAsync(() => listVehicles(), [])
  const depots = useAsync(() => adminDepots(), [])
  const [editing, setEditing] = useState<VehicleResponse | 'new' | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const list = vehicles.data ?? []

  async function remove(v: VehicleResponse) {
    if (!window.confirm(`Delete vehicle ${v.vehicleCode}? Vehicles with trips cannot be deleted.`)) return
    setError(null)
    try {
      await adminDeleteVehicle(v.id)
      vehicles.reload()
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <div>
      <PageHeader
        title="Fleet"
        subtitle={`${list.length} vehicles`}
        actions={
          <Button size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setEditing('new')}>
            Add vehicle
          </Button>
        }
      />

      {error && <p role="alert" className="mb-4 rounded-lg bg-danger-50 px-3 py-2 text-sm text-danger-600">{error}</p>}

      {editing && (
        <VehicleEditor
          key={editing === 'new' ? 'new' : editing.id}
          vehicle={editing === 'new' ? null : editing}
          depots={depots.data ?? []}
          busy={busy}
          setBusy={setBusy}
          onDone={() => {
            setEditing(null)
            vehicles.reload()
          }}
          onCancel={() => setEditing(null)}
          onError={setError}
        />
      )}

      <Card className="mt-5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs text-slate-400">
                <th className="px-4 py-3 font-medium">Vehicle</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Temperature</th>
                <th className="px-4 py-3 font-medium">Capacity</th>
                <th className="px-4 py-3 font-medium">Depot</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {list.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-800">{v.vehicleCode}</td>
                  <td className="px-4 py-3 text-slate-500">{v.type === 'TRUCK' ? 'Truck' : 'Van'}</td>
                  <td className="px-4 py-3">
                    <Badge tone={v.temp === 'REEFER' ? 'info' : 'neutral'}>{v.temp === 'REEFER' ? 'Reefer' : 'Ambient'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {v.weightCapKg} kg · {v.volumeCapM3} m³
                  </td>
                  <td className="px-4 py-3 text-slate-500">{v.depotCode}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setEditing(v)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label={`Edit ${v.vehicleCode}`}>
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => remove(v)} className="rounded-lg p-2 text-slate-400 hover:bg-danger-50 hover:text-danger-600" aria-label={`Delete ${v.vehicleCode}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
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

function VehicleEditor({
  vehicle,
  depots,
  busy,
  setBusy,
  onDone,
  onCancel,
  onError,
}: {
  vehicle: VehicleResponse | null
  depots: Depot[]
  busy: boolean
  setBusy: (value: boolean) => void
  onDone: () => void
  onCancel: () => void
  onError: (message: string | null) => void
}) {
  const [form, setForm] = useState<VehicleForm>(
    vehicle
      ? {
          vehicleCode: vehicle.vehicleCode,
          type: vehicle.type,
          temp: vehicle.temp,
          weightCapKg: vehicle.weightCapKg,
          volumeCapM3: vehicle.volumeCapM3,
          fuelType: vehicle.fuelType,
          kmPerL: vehicle.kmPerL,
          weeklyFuelQuotaL: vehicle.weeklyFuelQuotaL,
          depotCode: vehicle.depotCode,
        }
      : EMPTY,
  )

  function set<K extends keyof VehicleForm>(key: K, value: VehicleForm[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  useEffect(() => {
    if (!form.depotCode && depots.length > 0) set('depotCode', depots[0].code)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [depots])

  const numeric = (v: number) => Number.isFinite(v) && v > 0
  const valid =
    form.vehicleCode.trim() &&
    form.fuelType.trim() &&
    form.depotCode.trim() &&
    numeric(form.weightCapKg) &&
    numeric(form.volumeCapM3) &&
    numeric(form.kmPerL) &&
    numeric(form.weeklyFuelQuotaL)

  async function save() {
    setBusy(true)
    onError(null)
    const body = { ...form, vehicleCode: form.vehicleCode.trim(), fuelType: form.fuelType.trim(), depotCode: form.depotCode.trim() }
    try {
      if (vehicle) await adminUpdateVehicle(vehicle.id, body)
      else await adminCreateVehicle(body)
      onDone()
    } catch (err) {
      onError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardBody className="space-y-4">
        <p className="text-sm font-semibold text-slate-900">{vehicle ? `Edit ${vehicle.vehicleCode}` : 'New vehicle'}</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <label className="text-xs text-slate-500">
            Vehicle code
            <input value={form.vehicleCode} onChange={(e) => set('vehicleCode', e.target.value)} className={field} />
          </label>
          <label className="text-xs text-slate-500">
            Type
            <select value={form.type} onChange={(e) => set('type', e.target.value as VehicleForm['type'])} className={field}>
              <option value="TRUCK">Truck</option>
              <option value="VAN">Van</option>
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Temperature
            <select value={form.temp} onChange={(e) => set('temp', e.target.value as VehicleForm['temp'])} className={field}>
              <option value="AMBIENT">Ambient</option>
              <option value="REEFER">Reefer</option>
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Weight capacity (kg)
            <input type="number" min={0} value={form.weightCapKg} onChange={(e) => set('weightCapKg', Number(e.target.value))} className={field} />
          </label>
          <label className="text-xs text-slate-500">
            Volume capacity (m³)
            <input type="number" min={0} step="0.1" value={form.volumeCapM3} onChange={(e) => set('volumeCapM3', Number(e.target.value))} className={field} />
          </label>
          <label className="text-xs text-slate-500">
            Fuel type
            <input value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)} className={field} />
          </label>
          <label className="text-xs text-slate-500">
            Km per litre
            <input type="number" min={0} step="0.1" value={form.kmPerL} onChange={(e) => set('kmPerL', Number(e.target.value))} className={field} />
          </label>
          <label className="text-xs text-slate-500">
            Weekly fuel quota (L)
            <input type="number" min={0} value={form.weeklyFuelQuotaL} onChange={(e) => set('weeklyFuelQuotaL', Number(e.target.value))} className={field} />
          </label>
          <label className="text-xs text-slate-500">
            Depot
            <select value={form.depotCode} onChange={(e) => set('depotCode', e.target.value)} className={field}>
              {depots.length === 0 && <option value="">No depot found</option>}
              {depots.map((d) => (
                <option key={d.id} value={d.code}>
                  {d.name || d.code} · {d.district}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={!valid || busy}>
            {busy ? 'Saving…' : 'Save vehicle'}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
