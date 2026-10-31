import '@testing-library/jest-dom/vitest'
import { act, render, screen } from '@testing-library/react'
import { FamilyProvider, useFamily } from '@/app/FamilyProvider'
import type { Family, UserProfile } from '@/data/converters'

let emitUser: (u: UserProfile | null) => void = () => undefined
let emitFamily: (f: Family | null) => void = () => undefined
let failFamily: () => void = () => undefined
const watchFamily = vi.fn()

vi.mock('@/app/AuthProvider', () => ({
  useAuth: () => ({ status: 'signedIn', user: { uid: 'u1', displayName: 'A', email: 'a@b.co' } }),
}))
vi.mock('@/data/users', () => ({
  watchUser: (_uid: string, cb: (u: UserProfile | null) => void) => {
    emitUser = cb
    return () => undefined
  },
}))
vi.mock('@/data/families', () => ({
  watchFamily: (id: string, cb: (f: Family | null) => void, onError?: () => void) => {
    watchFamily(id)
    emitFamily = cb
    failFamily = onError ?? (() => undefined)
    return () => undefined
  },
}))

function Probe() {
  const state = useFamily()
  return (
    <>
      <p>{`${state.status}:${state.family?.name ?? '-'}`}</p>
      {state.status === 'error' && <button onClick={state.retry}>retry</button>}
    </>
  )
}

const profile = (familyId: string | null): UserProfile => ({
  displayName: 'A',
  email: 'a@b.co',
  familyId,
  createdAt: new Date(),
})

describe('FamilyProvider', () => {
  it('S-011 AC6: exposes loading, none and ready from watchUser/watchFamily', () => {
    render(
      <FamilyProvider>
        <Probe />
      </FamilyProvider>,
    )
    expect(screen.getByText('loading:-')).toBeInTheDocument()
    act(() => emitUser(profile(null)))
    expect(screen.getByText('none:-')).toBeInTheDocument()
    act(() => emitUser(profile('f1')))
    expect(watchFamily).toHaveBeenCalledWith('f1')
    expect(screen.getByText('loading:-')).toBeInTheDocument()
    act(() =>
      emitFamily({
        id: 'f1',
        name: 'Casa',
        members: ['u1'],
        ownerId: 'u1',
        inviteCode: 'ABCD2345',
        createdAt: new Date(),
      }),
    )
    expect(screen.getByText('ready:Casa')).toBeInTheDocument()
  })

  it('leaves loading with an error state when the family watch gives up, and retry resubscribes', () => {
    watchFamily.mockClear()
    render(
      <FamilyProvider>
        <Probe />
      </FamilyProvider>,
    )
    act(() => emitUser(profile('f2')))
    expect(watchFamily).toHaveBeenCalledTimes(1)
    act(() => failFamily())
    expect(screen.getByText('error:-')).toBeInTheDocument()
    act(() => screen.getByText('retry').click())
    expect(watchFamily).toHaveBeenCalledTimes(2)
    expect(screen.getByText('loading:-')).toBeInTheDocument()
  })
})
