import type { Item } from './converters'
import { toggleItemStatus } from './items'

const fs = vi.hoisted(() => ({
  updateDoc: vi.fn(() => Promise.resolve()),
  doc: vi.fn(() => ({ id: 'ref' })),
}))
vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: fs.doc,
  onSnapshot: vi.fn(),
  serverTimestamp: () => 'TS',
  updateDoc: fs.updateDoc,
  writeBatch: vi.fn(),
}))
vi.mock('@/data/firebase', () => ({ auth: { currentUser: { uid: 'u1' } }, db: {} }))

const item = (status: Item['status']) => ({ id: 'i1', status }) as Item

describe('S-028 AC1: toggleItemStatus', () => {
  beforeEach(() => fs.updateDoc.mockClear())

  it('pending -> bought writes status, markedBy and markedAt', () => {
    toggleItemStatus('f1', item('pending'))
    expect(fs.updateDoc).toHaveBeenCalledWith(expect.anything(), {
      status: 'bought',
      markedBy: 'u1',
      markedAt: 'TS',
    })
  })

  it('bought -> pending clears the mark', () => {
    toggleItemStatus('f1', item('bought'))
    expect(fs.updateDoc).toHaveBeenCalledWith(expect.anything(), {
      status: 'pending',
      markedBy: null,
      markedAt: null,
    })
  })
})
