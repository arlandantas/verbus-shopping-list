import type { Item } from './converters'
import { CHECKOUT_CHUNK, checkout } from './checkout'

const fs = vi.hoisted(() => {
  const batches: {
    set: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    commit: ReturnType<typeof vi.fn>
  }[] = []
  return {
    batches,
    writeBatch: vi.fn(() => {
      const b = { set: vi.fn(), delete: vi.fn(), commit: vi.fn(() => Promise.resolve()) }
      batches.push(b)
      return b
    }),
  }
})
const fire = vi.hoisted(() => vi.fn())
let seq = 0
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => ({ id: 'col' })),
  doc: vi.fn(() => ({ id: `d${seq++}` })),
  serverTimestamp: () => 'TS',
  writeBatch: fs.writeBatch,
}))
vi.mock('@/data/firebase', () => ({ auth: { currentUser: { uid: 'u1' } }, db: {} }))
vi.mock('./writeErrors', () => ({ fireAndForget: fire }))

const items = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    id: `i${i}`,
    name: `Item ${i}`,
    nameKey: `item ${i}`,
    quantity: 1,
    unit: 'un',
    categoryId: null,
    priceCents: null,
    markedBy: 'u1',
  })) as unknown as Item[]

describe('S-039 AC5: checkout (unit)', () => {
  beforeEach(() => {
    fs.batches.length = 0
    fs.writeBatch.mockClear()
    fire.mockClear()
  })

  it('returns void and calls fireAndForget once per chunk', () => {
    const r: unknown = checkout('f1', items(CHECKOUT_CHUNK + 1), { market: null, categories: [] })
    expect(r).toBeUndefined()
    expect(CHECKOUT_CHUNK).toBe(200)
    expect(fire).toHaveBeenCalledTimes(2)
    expect(fs.batches[0].delete).toHaveBeenCalledTimes(200)
    expect(fs.batches[0].set).toHaveBeenCalledTimes(201)
    expect(fs.batches[1].set).toHaveBeenCalledTimes(2)
  })

  it('writes nothing for an empty list', () => {
    checkout('f1', [], { market: 'x', categories: [] })
    expect(fs.writeBatch).not.toHaveBeenCalled()
    expect(fire).not.toHaveBeenCalled()
  })
})
