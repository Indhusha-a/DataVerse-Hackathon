// Dates use the operating zone (Sri Lanka). Times from the backend arrive as "HH:mm:ss".

const ZONE = 'Asia/Colombo'

function partsIn(date: Date) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
  const [y, m, d] = fmt.format(date).split('-').map(Number)
  return { y, m, d }
}

export function todayIso(now = new Date()): string {
  const { y, m, d } = partsIn(now)
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}

export function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay() // 0 = Sunday
}

/** The next day Waypoint operates: tomorrow, skipping Sundays. */
export function nextOperatingDay(fromIso: string): string {
  let candidate = addDays(fromIso, 1)
  while (weekdayOf(candidate) === 0) candidate = addDays(candidate, 1)
  return candidate
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  })
}

export function formatTime(value: string | null | undefined): string {
  if (!value) return '—'
  return value.slice(0, 5)
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('en-GB', { timeZone: ZONE, day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
