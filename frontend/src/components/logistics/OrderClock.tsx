import { useEffect, useState } from 'react'
import { Clock3 } from 'lucide-react'
import { cn } from '@/lib/utils'

// Sri Lanka has no daylight-saving shift, so the +05:30 offset is fixed here.
function targetMs(date: string, time: string): number {
  return new Date(`${date}T${time}+05:30`).getTime()
}

function formatRemaining(ms: number): string {
  const abs = Math.abs(ms)
  const totalMinutes = Math.floor(abs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${minutes}m`
  if (minutes > 0) return `${minutes}m`
  return `${Math.floor((abs % 60000) / 1000)}s`
}

/** A live countdown to a planned time (arrival or window close), ticking every
 * second. `date` is the operating date (YYYY-MM-DD) and `time` is a LocalTime
 * string (HH:mm[:ss]) as the backend sends it. */
export function OrderClock({ date, time, label = 'Window closes' }: { date: string; time: string; label?: string }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = targetMs(date, time) - now
  const overdue = diff <= 0
  const urgent = !overdue && diff <= 30 * 60 * 1000

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold tabular-nums',
        overdue ? 'bg-danger-50 text-danger-700' : urgent ? 'bg-warning-50 text-warning-700' : 'bg-slate-100 text-slate-600',
      )}
    >
      <Clock3 className="h-3.5 w-3.5" />
      {overdue ? `${label} — ${formatRemaining(diff)} overdue` : `${label} in ${formatRemaining(diff)}`}
    </span>
  )
}
