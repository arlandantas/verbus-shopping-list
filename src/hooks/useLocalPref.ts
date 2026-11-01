import { useCallback, useState } from 'react'

function read<T>(key: string, fallback: T, valid: (v: unknown) => v is T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    return valid(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

/** Device-local preference in localStorage; corrupt or invalid stored values fall back to the default. */
export function useLocalPref<T>(
  key: string,
  fallback: T,
  valid: (v: unknown) => v is T,
): [T, (next: T) => void] {
  const [value, setValue] = useState<T>(() => read(key, fallback, valid))
  const set = useCallback(
    (next: T) => {
      setValue(next)
      try {
        window.localStorage.setItem(key, JSON.stringify(next))
      } catch {
        // storage unavailable: keep the in-memory value
      }
    },
    [key],
  )
  return [value, set]
}
