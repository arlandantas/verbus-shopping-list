import '@testing-library/jest-dom/vitest'
import { act, render, screen } from '@testing-library/react'
import { cycleOf } from '@/domain/cycle'
import { FamilyProvider, useFamily } from '@/app/FamilyProvider'
import type { Family, UserProfile } from '@/data/converters'

let emitUser: (u: UserProfile | null) => void = () => undefined
let emitFamily: (f: Family | null) => void = () => undefined
let failFamily: () => void = () => undefined
const watchFamily = vi.fn()
const ensureMemberProfile = vi.fn()
const openCycleIfNeeded = vi.fn<(...args: unknown[]) => Promise<unknown>>(() =>
  Promise.resolve({ added: 0 }),
)

vi.mock('@/app/AuthProvider', () => ({
  useAuth: () => ({ status: 'signedIn', user: { uid: 'u1', displayName: 'A', email: 'a@b.co' } }),
}))
vi.mock('@/data/users', () => ({
  watchUser: (_uid: string, cb: (u: UserProfile | null) => void) => {
    emitUser = cb
    return () => undefined
  },
}))
vi.mock('@/data/members', () => ({
  ensureMemberProfile: (...args: unknown[]) => ensureMemberProfile(...args),
}))
vi.mock('@/data/cycles', () => ({
  openCycleIfNeeded: (...args: unknown[]) => openCycleIfNeeded(...args),
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

  it('S-027 AC4: calls ensureMemberProfile once the family is ready', () => {
    ensureMemberProfile.mockClear()
    render(
      <FamilyProvider>
        <Probe />
      </FamilyProvider>,
    )
    act(() => emitUser({ ...profile('f3'), displayName: 'Ana' }))
    expect(ensureMemberProfile).not.toHaveBeenCalled()
    act(() =>
      emitFamily({
        id: 'f3',
        name: 'Casa',
        members: ['u1'],
        ownerId: 'u1',
        inviteCode: 'ABCD2345',
        createdAt: new Date(),
      }),
    )
    expect(ensureMemberProfile).toHaveBeenCalledWith('f3', 'u1', 'Ana')
  })

  it('S-041 AC4: opens the cycle once ready and again on the online event', () => {
    openCycleIfNeeded.mockClear()
    render(
      <FamilyProvider>
        <Probe />
      </FamilyProvider>,
    )
    act(() => emitUser(profile('f4')))
    expect(openCycleIfNeeded).not.toHaveBeenCalled()
    act(() =>
      emitFamily({
        id: 'f4',
        name: 'Casa',
        members: ['u1'],
        ownerId: 'u1',
        inviteCode: 'ABCD2345',
        createdAt: new Date(),
      }),
    )
    expect(openCycleIfNeeded).toHaveBeenCalledTimes(1)
    expect(openCycleIfNeeded).toHaveBeenCalledWith('f4', cycleOf(new Date()))
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(openCycleIfNeeded).toHaveBeenCalledTimes(2)
  })
})
