import { cn } from '@/lib/utils'

export function CapacityBar({ label, used, total, unit = '' }: { label: string; used: number; total: number; unit?: string }) {
  const pct = Math.min(100, Math.round((used / total) * 100))
  const color = pct >= 90 ? 'bg-danger-500' : pct >= 70 ? 'bg-warning-500' : 'bg-success-500'

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{label}</span>
        <span className="font-medium text-slate-700">
          {used.toLocaleString()} / {total.toLocaleString()} {unit} · {pct}%
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
