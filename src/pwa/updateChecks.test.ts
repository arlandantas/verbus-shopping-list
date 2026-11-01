import { startUpdateChecks, UPDATE_CHECK_INTERVAL_MS } from './updateChecks'

describe('S-083 AC4: update checks', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('checks on visibility return, at most every 60 min', () => {
    const update = vi.fn().mockResolvedValue(undefined)
    const stop = startUpdateChecks({ update }, document, () => Date.now())
    const show = () => document.dispatchEvent(new Event('visibilitychange'))
    show()
    expect(update).not.toHaveBeenCalled()
    vi.setSystemTime(Date.now() + UPDATE_CHECK_INTERVAL_MS - 1000)
    show()
    expect(update).not.toHaveBeenCalled()
    vi.setSystemTime(Date.now() + 2000)
    show()
    expect(update).toHaveBeenCalledTimes(1)
    show()
    expect(update).toHaveBeenCalledTimes(1)
    stop()
  })

  it('checks hourly by timer and stops on cleanup', () => {
    const update = vi.fn().mockResolvedValue(undefined)
    const stop = startUpdateChecks({ update })
    vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS)
    expect(update).toHaveBeenCalledTimes(1)
    stop()
    vi.advanceTimersByTime(UPDATE_CHECK_INTERVAL_MS * 2)
    expect(update).toHaveBeenCalledTimes(1)
  })
})
