import { watchFamily } from '@/data/families'

type ErrCb = (e: Error) => void
type OkCb = (snap: unknown) => void
const listeners: ErrCb[] = []
const oks: OkCb[] = []

vi.mock('@/data/firebase', () => ({ auth: {}, db: {} }))
vi.mock('firebase/firestore', () => ({
  arrayUnion: vi.fn(),
  collection: vi.fn(),
  doc: () => ({ withConverter: () => ({}) }),
  getDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  writeBatch: vi.fn(),
  onSnapshot: (_ref: unknown, _opts: unknown, ok: OkCb, err: ErrCb) => {
    oks.push(ok)
    listeners.push(err)
    return () => undefined
  },
}))

describe('watchFamily', () => {
  beforeEach(() => {
    listeners.length = 0
    oks.length = 0
    vi.useFakeTimers()
  })
  afterEach(() => vi.useRealTimers())

  it('reports an error once retries run out instead of stopping silently', async () => {
    const onError = vi.fn()
    watchFamily('f1', vi.fn(), onError)
    for (let i = 0; i < 5; i++) {
      listeners.at(-1)?.(new Error('denied'))
      expect(onError).not.toHaveBeenCalled()
      await vi.advanceTimersByTimeAsync(300 * (i + 1))
    }
    listeners.at(-1)?.(new Error('denied'))
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('does not report an error after unsubscribe', () => {
    const onError = vi.fn()
    const off = watchFamily('f1', vi.fn(), onError)
    off()
    for (let i = 0; i < 7; i++) listeners.at(-1)?.(new Error('denied'))
    expect(onError).not.toHaveBeenCalled()
  })

  it('S-020 AC3 flake: hides the family while its create/join write is still local-only', () => {
    // Otherwise the UI opens the list and its listeners/writes hit the server before the family
    // exists there (not a member yet -> permission-denied, listener dies).
    const cb = vi.fn()
    watchFamily('f1', cb)
    const snap = (pending: boolean) => ({
      exists: () => true,
      metadata: { hasPendingWrites: pending },
      data: () => ({ id: 'f1' }),
    })
    oks.at(-1)?.(snap(true))
    expect(cb).not.toHaveBeenCalled()
    oks.at(-1)?.(snap(false))
    expect(cb).toHaveBeenCalledTimes(1)
  })
})
