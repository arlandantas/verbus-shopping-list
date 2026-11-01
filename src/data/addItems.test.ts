import { addItem, addItems } from './items'

const fs = vi.hoisted(() => {
  const batch = { set: vi.fn(), commit: vi.fn(() => new Promise<void>(() => {})) }
  let n = 0
  return {
    batch,
    writeBatch: vi.fn(() => batch),
    doc: vi.fn((_: unknown, ...path: string[]) => ({ id: path.length > 2 ? 'cat' : `id${++n}` })),
  }
})
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(() => 'col'),
  deleteDoc: vi.fn(),
  doc: fs.doc,
  onSnapshot: vi.fn(),
  serverTimestamp: () => 'TS',
  updateDoc: vi.fn(),
  writeBatch: fs.writeBatch,
}))
vi.mock('@/data/firebase', () => ({ auth: { currentUser: { uid: 'u1' } }, db: {} }))

const input = (name: string) => ({ name, quantity: 1, unit: 'un' as const })

describe('S-093 AC6: addItems', () => {
  beforeEach(() => {
    fs.batch.set.mockClear()
    fs.batch.commit.mockClear()
    fs.writeBatch.mockClear()
  })

  it('uses one batch, two sets per entry, one un-awaited commit, returns ids at once', () => {
    const ids = addItems('f1', [input('Arroz'), input('Leite')])
    expect(ids).toHaveLength(2)
    expect(fs.writeBatch).toHaveBeenCalledTimes(1)
    expect(fs.batch.set).toHaveBeenCalledTimes(4)
    expect(fs.batch.commit).toHaveBeenCalledTimes(1)
  })

  it('creates no batch for an empty list', () => {
    expect(addItems('f1', [])).toEqual([])
    expect(fs.writeBatch).not.toHaveBeenCalled()
  })

  it('addItem shares the helper: same writes, single id', () => {
    const id = addItem('f1', { ...input('Arroz'), recurring: true })
    expect(typeof id).toBe('string')
    expect(fs.batch.set).toHaveBeenCalledTimes(2)
    expect(fs.batch.set.mock.calls[1]![1]).toMatchObject({ nameKey: 'arroz', recurring: true })
  })

  it('does not write recurring to the catalog when the input omits it', () => {
    addItems('f1', [input('Arroz')])
    expect(fs.batch.set.mock.calls[1]![1]).not.toHaveProperty('recurring')
  })
})
