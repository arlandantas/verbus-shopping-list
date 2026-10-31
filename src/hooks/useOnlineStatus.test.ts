import { act, renderHook } from '@testing-library/react'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'

function setOnLine(value: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { value, configurable: true })
}

describe('useOnlineStatus', () => {
  afterEach(() => setOnLine(true))

  it('S-005 AC4: reflects online/offline events', () => {
    setOnLine(true)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)

    act(() => {
      setOnLine(false)
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current).toBe(false)

    act(() => {
      setOnLine(true)
      window.dispatchEvent(new Event('online'))
    })
    expect(result.current).toBe(true)
  })
})
