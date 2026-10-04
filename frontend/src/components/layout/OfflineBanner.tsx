import { AnimatePresence, motion } from 'framer-motion'
import { WifiOff } from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { useSyncQueue } from '@/store/useSyncQueue'

export function OfflineBanner() {
  const simulateOffline = useUiStore((s) => s.simulateOffline)
  const queued = useSyncQueue((s) => s.events.filter((e) => e.status === 'pending').length)
  const offline = simulateOffline || (typeof navigator !== 'undefined' && !navigator.onLine)

  return (
    <AnimatePresence>
      {offline && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3">
            <WifiOff className="h-4.5 w-4.5 flex-shrink-0 text-warning-600" />
            <div>
              <p className="text-sm font-semibold text-warning-800">Offline mode</p>
              <p className="text-xs text-warning-700">
                Stops stay available on this device. Actions are queued{queued > 0 ? ` (${queued} waiting)` : ''} and
                sync automatically when the connection returns.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
