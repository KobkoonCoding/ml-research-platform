import { useEffect, useState } from 'react'

/**
 * Debounce any value. Returns the latest value after ``delay`` ms of no change.
 * Useful for live-predict flows driven by slider/input changes.
 */
export function useDebounce(value, delay = 250) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}
