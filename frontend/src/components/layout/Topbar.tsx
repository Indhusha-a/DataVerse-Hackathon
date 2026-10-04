import { Bell, CalendarDays, Menu, RefreshCcw, Waypoints, Wifi, WifiOff } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'
import { useUiStore } from '@/store/useUiStore'
import { useSyncQueue } from '@/store/useSyncQueue'
import { useClock } from '@/lib/useClock'
import { formatDate } from '@/lib/dates'
import { notifications } from '@/api/endpoints'
import { usePolling } from '@/hooks/useAsync'
import { NotificationsPanel } from './NotificationsPanel'

export function Topbar({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const now = useClock()
  const currentUser = useAuthStore((s) => s.currentUser)
  const { toggleNotifications, operatingDate, setOperatingDate, simulateOffline, toggleSimulateOffline } = useUiStore()
  const queued = useSyncQueue((s) => s.events.filter((e) => e.status === 'pending').length)
  const feed = usePolling(() => notifications(), 20000, [currentUser?.userId])

  if (!currentUser) return null
  const unread = (feed.data ?? []).filter((n) => !n.read).length
  const timeLabel = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Colombo' })
  const online = !simulateOffline && navigator.onLine

  return (
    <header className="relative flex h-14 flex-shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileNav}
          aria-label="Open navigation"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2 lg:hidden">
          <Waypoints className="h-4 w-4 text-brand-600" />
          <span className="font-display text-sm font-bold text-slate-900">WAYPOINT</span>
        </div>
        <label className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600 md:flex">
          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-400">Operating day</span>
          <input
            type="date"
            value={operatingDate}
            onChange={(e) => e.target.value && setOperatingDate(e.target.value)}
            className="bg-transparent font-medium text-slate-800 outline-none"
          />
          <span className="text-slate-400">{formatDate(operatingDate)}</span>
        </label>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {currentUser.role === 'DRIVER' && (
          <button
            onClick={toggleSimulateOffline}
            title={simulateOffline ? 'Simulated offline: actions are queued on this device' : 'Simulate losing connectivity'}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              online ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'
            }`}
          >
            {online ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{online ? 'Online' : 'Offline'}</span>
            {queued > 0 && <span className="rounded-full bg-warning-500 px-1.5 text-[10px] text-white">{queued}</span>}
          </button>
        )}

        {currentUser.role === 'DRIVER' && queued > 0 && online && (
          <button
            onClick={() => useSyncQueue.getState().flush()}
            className="hidden items-center gap-1.5 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-medium text-white sm:flex"
          >
            <RefreshCcw className="h-3.5 w-3.5" /> Sync
          </button>
        )}

        <div className="hidden text-right lg:block">
          <p className="text-sm font-semibold text-slate-900">{timeLabel}</p>
        </div>

        <button
          onClick={toggleNotifications}
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <Bell className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger-500 px-1 text-[9px] font-bold text-white">
              {unread}
            </span>
          )}
        </button>

        <div
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
          style={{ backgroundColor: currentUser.avatarColor }}
          title={currentUser.fullName}
        >
          {currentUser.fullName
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)}
        </div>
      </div>

      <NotificationsPanel items={feed.data ?? []} onChanged={feed.reload} />
    </header>
  )
}
