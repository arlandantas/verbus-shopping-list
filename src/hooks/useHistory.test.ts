import { act, renderHook } from '@testing-library/react'
import type { Purchase, PurchaseLine } from '@/data/converters'
import { useCycleLines, usePurchases } from '@/hooks/useHistory'

let pushP: ((l: Purchase[]) => void) | undefined
let pushL: ((l: PurchaseLine[]) => void) | undefined
vi.mock('@/data/history', () => ({
  watchPurchases: (_f: string, cb: (l: Purchase[]) => void) => {
    pushP = cb
    return () => undefined
  },
  watchCycleLines: (_f: string, _c: string, cb: (l: PurchaseLine[]) => void) => {
    pushL = cb
    return () => undefined
  },
}))

describe('useHistory', () => {
  it('S-040 AC4: usePurchases is null until the first snapshot', () => {
    const { result } = renderHook(() => usePurchases('f1'))
    expect(result.current).toBeNull()
    act(() => pushP?.([]))
    expect(result.current).toEqual([])
  })

  it('S-040 AC4: useCycleLines is null until the first snapshot', () => {
    const { result } = renderHook(() => useCycleLines('f1', '2026-11'))
    expect(result.current).toBeNull()
    act(() => pushL?.([]))
    expect(result.current).toEqual([])
  })

  it('S-040 AC4: no family id stays null', () => {
    expect(renderHook(() => usePurchases(undefined)).result.current).toBeNull()
    expect(renderHook(() => useCycleLines(undefined, '2026-11')).result.current).toBeNull()
  })
})
