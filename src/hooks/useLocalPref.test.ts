import { act, renderHook } from '@testing-library/react'
import { useLocalPref } from './useLocalPref'

const isBool = (v: unknown): v is boolean => typeof v === 'boolean'

describe('S-059 AC4: useLocalPref', () => {
  beforeEach(() => window.localStorage.clear())

  it('persists and restores the value', () => {
    const a = renderHook(() => useLocalPref('verbus.ui.x', false, isBool))
    act(() => a.result.current[1](true))
    expect(window.localStorage.getItem('verbus.ui.x')).toBe('true')
    const b = renderHook(() => useLocalPref('verbus.ui.x', false, isBool))
    expect(b.result.current[0]).toBe(true)
  })

  it('falls back to the default on corrupt or invalid values', () => {
    window.localStorage.setItem('verbus.ui.x', '{oops')
    expect(renderHook(() => useLocalPref('verbus.ui.x', false, isBool)).result.current[0]).toBe(
      false,
    )
    window.localStorage.setItem('verbus.ui.x', '"str"')
    expect(renderHook(() => useLocalPref('verbus.ui.x', false, isBool)).result.current[0]).toBe(
      false,
    )
  })
})
