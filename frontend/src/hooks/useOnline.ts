import { useEffect, useState } from 'react'
import { useUiStore } from '@/store/useUiStore'

/** True when the device has a connection and the driver has not simulated going offline. */
export function useOnline(): boolean {
  const simulateOffline = useUiStore((s) => s.simulateOffline)
  const [browserOnline, setBrowserOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))

  useEffect(() => {
    const up = () => setBrowserOnline(true)
    const down = () => setBrowserOnline(false)
    window.addEventListener('online', up)
    window.addEventListener('offline', down)
    return () => {
      window.removeEventListener('online', up)
      window.removeEventListener('offline', down)
    }
  }, [])

  return browserOnline && !simulateOffline
}
