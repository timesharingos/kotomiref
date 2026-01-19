import { useState, useEffect, useCallback, useRef } from 'react'

interface UseAsyncDataResult<T> {
  data: T
  loading: boolean
  error: Error | null
  reload: () => void
}

/**
 * Custom hook for async data fetching without triggering linter warnings
 * Uses a ref to track mounted state and avoids setState in effect body
 */
export function useAsyncData<T>(
  fetcher: () => Promise<T>,
  initialData: T
): UseAsyncDataResult<T> {
  const [data, setData] = useState<T>(initialData)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await fetcher()
        if (mountedRef.current) {
          setData(result)
        }
      } catch (e) {
        if (mountedRef.current) {
          setError(e instanceof Error ? e : new Error(String(e)))
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      mountedRef.current = false
    }
  }, [fetcher, reloadTrigger])

  const reload = useCallback(() => {
    setReloadTrigger(prev => prev + 1)
  }, [])

  return { data, loading, error, reload }
}

