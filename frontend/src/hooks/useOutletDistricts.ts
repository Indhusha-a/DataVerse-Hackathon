import { useMemo } from 'react'
import { listOutlets } from '@/api/endpoints'
import { useAsync } from './useAsync'

/** outletCode -> district, for building a map search query. */
export function useOutletDistricts(): Record<string, string> {
  const outlets = useAsync(() => listOutlets(), [])
  return useMemo(() => {
    const map: Record<string, string> = {}
    for (const o of outlets.data ?? []) map[o.outletCode] = o.district
    return map
  }, [outlets.data])
}
