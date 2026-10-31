import { renderHook } from '@testing-library/react'
import { useCatalog } from './useCatalog'
import { useItems } from './useItems'

const watchItems = vi.hoisted(() => vi.fn())
const watchCatalog = vi.hoisted(() => vi.fn())
vi.mock('@/data/items', () => ({ watchItems }))
vi.mock('@/data/catalog', () => ({ watchCatalog }))

beforeEach(() => {
  for (const w of [watchItems, watchCatalog]) {
    w.mockReset()
    w.mockImplementation((familyId: string) => {
      if (!familyId) throw new Error('empty familyId')
      return () => undefined
    })
  }
})

describe('hooks skip subscribing without a family', () => {
  it('useItems does not subscribe for an empty familyId', () => {
    const { result } = renderHook(() => useItems(''))
    expect(watchItems).not.toHaveBeenCalled()
    expect(result.current).toBeNull()
  })

  it('useCatalog does not subscribe for an empty familyId', () => {
    const { result } = renderHook(() => useCatalog(''))
    expect(watchCatalog).not.toHaveBeenCalled()
    expect(result.current).toEqual([])
  })

  it('subscribes once a familyId is present', () => {
    renderHook(() => useItems('f1'))
    renderHook(() => useCatalog('f1'))
    expect(watchItems).toHaveBeenCalledTimes(1)
    expect(watchCatalog).toHaveBeenCalledTimes(1)
  })
})
