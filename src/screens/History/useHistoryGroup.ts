import { useState } from 'react'

export type HistoryGroup = 'category' | 'purchase'
const KEY = 'verbus.ui.historyGroup'

function read(): HistoryGroup {
  try {
    return localStorage.getItem(KEY) === 'purchase' ? 'purchase' : 'category'
  } catch {
    return 'category'
  }
}

/** Month view grouping, remembered on this device. */
export function useHistoryGroup(): [HistoryGroup, (g: HistoryGroup) => void] {
  const [group, setGroup] = useState<HistoryGroup>(read)
  const update = (g: HistoryGroup) => {
    setGroup(g)
    try {
      localStorage.setItem(KEY, g)
    } catch {
      /* storage unavailable: keep in memory only */
    }
  }
  return [group, update]
}
