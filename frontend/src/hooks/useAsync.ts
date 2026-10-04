import { useCallback, useEffect, useRef, useState, type DependencyList } from 'react'
import { errorMessage } from '@/api/client'

interface AsyncState<T> {
  data: T | undefined
  error: string | null
  loading: boolean
  reload: () => void
  setData: (data: T) => void
}

/** Loads data when `deps` change. Responses from superseded requests are ignored. */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList): AsyncState<T> {
  const [data, setDataState] = useState<T>()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const requestId = useRef(0)

  const run = useCallback(() => {
    const id = ++requestId.current
    setLoading(true)
    loader()
      .then((result) => {
        if (id !== requestId.current) return
        setDataState(result)
        setError(null)
      })
      .catch((err: unknown) => {
        if (id !== requestId.current) return
        setError(errorMessage(err))
      })
      .finally(() => {
        if (id === requestId.current) setLoading(false)
      })
    // The caller controls when the loader re-runs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { data, error, loading, reload: run, setData: setDataState }
}

/** Polls a loader on an interval. Used for notifications and live operations. */
export function usePolling<T>(loader: () => Promise<T>, intervalMs: number, deps: DependencyList) {
  const state = useAsync(loader, deps)
  const { reload } = state

  useEffect(() => {
    if (intervalMs <= 0) return
    const id = window.setInterval(reload, intervalMs)
    return () => window.clearInterval(id)
  }, [reload, intervalMs])

  return state
}
