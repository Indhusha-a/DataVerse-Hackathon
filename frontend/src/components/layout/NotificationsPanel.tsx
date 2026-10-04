import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { markNotificationRead } from '@/api/endpoints'
import { formatDateTime } from '@/lib/dates'
import { errorMessage } from '@/api/client'
import type { Notification } from '@/api/types'

type Severity = 'info' | 'success' | 'warning' | 'critical'

const SEVERITY_BY_EVENT: Record<string, Severity> = {
  DELIVERY_WINDOW_LATE: 'critical',
  DELIVERY_EXCEPTION: 'critical',
  RECEIPT_DISCREPANCY: 'warning',
  LOADING_SHORTFALL: 'warning',
  LOADING_ISSUE: 'warning',
  ORDER_DEFERRED: 'warning',
  ORDERS_DEFERRED: 'warning',
  SYNC_CONFLICT: 'warning',
  DELIVERY_COMPLETED: 'success',
  TRIP_DISPATCHED: 'info',
}

const ICONS: Record<Severity, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
}

const COLORS: Record<Severity, string> = {
  info: 'text-info-600 bg-info-50',
  success: 'text-success-600 bg-success-50',
  warning: 'text-warning-600 bg-warning-50',
  critical: 'text-danger-600 bg-danger-50',
}

const TITLE_BY_EVENT: Record<string, string> = {
  DELIVERY_WINDOW_LATE: 'Arrived after the window closed',
  DELIVERY_EXCEPTION: 'Delivery exception',
  RECEIPT_DISCREPANCY: 'Receipt differs from delivery',
  LOADING_SHORTFALL: 'Loading shortfall',
  LOADING_ISSUE: 'Loading issue',
  ORDER_DEFERRED: 'Order deferred',
  ORDERS_DEFERRED: 'Orders deferred',
  SYNC_CONFLICT: 'Offline event not applied',
  DELIVERY_COMPLETED: 'Delivery completed',
  TRIP_DISPATCHED: 'Trip dispatched',
}

export function NotificationsPanel({ items, onChanged }: { items: Notification[]; onChanged: () => void }) {
  const { notificationsOpen, closeNotifications } = useUiStore()

  async function markRead(id: string) {
    try {
      await markNotificationRead(id)
      onChanged()
    } catch (error) {
      console.warn(errorMessage(error))
    }
  }

  return (
    <AnimatePresence>
      {notificationsOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeNotifications} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-14 right-4 z-50 w-[360px] max-w-[90vw] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl lg:right-6"
          >
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-slate-400">You're all caught up.</p>
              )}
              {items.map((n) => {
                const severity = SEVERITY_BY_EVENT[n.eventType] ?? 'info'
                const Icon = ICONS[severity]
                return (
                  <button
                    key={n.id}
                    onClick={() => !n.read && markRead(n.id)}
                    className="flex w-full items-start gap-3 border-b border-slate-50 px-4 py-3 text-left last:border-0 hover:bg-slate-50"
                  >
                    <span className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${COLORS[severity]}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`text-sm font-medium ${n.read ? 'text-slate-500' : 'text-slate-900'}`}>
                          {TITLE_BY_EVENT[n.eventType] ?? n.eventType}
                        </span>
                        {!n.read && <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-brand-500" />}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500">{n.message}</span>
                      <span className="mt-1 block text-[11px] text-slate-400">{formatDateTime(n.createdAt)}</span>
                    </span>
                  </button>
                )
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
