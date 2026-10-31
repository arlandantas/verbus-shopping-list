import { act, renderHook } from '@testing-library/react'
import type { Category } from '@/data/converters'
import { useCategories } from '@/hooks/useCategories'

let push: ((c: Category[]) => void) | undefined
vi.mock('@/data/categories', () => ({
  watchCategories: (_f: string, cb: (c: Category[]) => void) => {
    push = cb
    return () => undefined
  },
}))

describe('useCategories', () => {
  it('S-037 AC4: null until the first snapshot, then the list', () => {
    const { result } = renderHook(() => useCategories('f1'))
    expect(result.current).toBeNull()
    const list: Category[] = [{ id: 'a', name: 'A', isDefault: false, order: 0 }]
    act(() => push?.(list))
    expect(result.current).toEqual(list)
  })

  it('S-037 AC4: no family id stays null', () => {
    const { result } = renderHook(() => useCategories(undefined))
    expect(result.current).toBeNull()
  })
})
