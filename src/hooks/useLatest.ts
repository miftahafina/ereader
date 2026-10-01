import { useEffect, useRef } from 'react'

export interface LatestRef<T> {
  current: T
}

export function useLatest<T>(value: T): LatestRef<T> {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}
