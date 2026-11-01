import '@testing-library/jest-dom/vitest'
import { act, render, screen } from '@testing-library/react'
import { cycleOf } from '@/domain/cycle'
import { FamilyProvider, useFamily } from '@/app/FamilyProvider'
import type { Family, UserProfile } from '@/data/converters'

let emitUser: (u: UserProfile | null) => void = () => undefined
let emitGroups: (g: Family[]) => void = () => undefined
let failGroups: () => void = () => undefined
const watchMyGroups = vi.fn()
const unsubscribeGroups = vi.fn()
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
  watchMyGroups: (uid: string, cb: (g: Family[]) => void, onError?: () => void) => {
    watchMyGroups(uid)
    emitGroups = cb
    failGroups = onError ?? (() => undefined)
    return unsubscribeGroups
  },
}))

function Probe() {
  const state = useFamily()
  return (
    <>
      <p>{`${state.status}:${state.family?.id ?? '-'}`}</p>
      <p>{`added:${state.recurringAdded}`}</p>
      <p>{`groups:${state.groups.map((g) => g.id).join(',')}`}</p>
      <button onClick={state.dismissRecurringNotice}>dismiss-notice</button>
      <button onClick={() => state.setActiveGroup('g2')}>switch-g2</button>
      <button onClick={() => state.setActiveGroup('g1')}>switch-g1</button>
      {state.status === 'error' && <button onClick={state.retry}>retry</button>}
    </>
  )
}

const profile = (familyId: string | null = null): UserProfile => ({
  displayName: 'Ana',
  email: 'a@b.co',
  familyId,
  createdAt: new Date(),
})
const group = (id: string, age = 0): Family => ({
  id,
  name: id,
  members: ['u1'],
  ownerId: 'u1',
  inviteCode: 'ABCD2345',
  createdAt: new Date(2026, 0, 1 + age),
})

function setup(user: UserProfile | null, groups: Family[]) {
  render(
    <FamilyProvider>
      <Probe />
    </FamilyProvider>,
  )
  act(() => emitUser(user))
  act(() => emitGroups(groups))
}

beforeEach(() => {
  localStorage.clear()
  ensureMemberProfile.mockClear()
  openCycleIfNeeded.mockClear()
  openCycleIfNeeded.mockResolvedValue({ added: 0 })
})

describe('FamilyProvider', () => {
  it('S-089 AC1: loading, then none with zero groups, ready with one', () => {
    render(
      <FamilyProvider>
        <Probe />
      </FamilyProvider>,
    )
    expect(screen.getByText('loading:-')).toBeInTheDocument()
    act(() => emitUser(profile()))
    act(() => emitGroups([]))
    expect(screen.getByText('none:-')).toBeInTheDocument()
    act(() => emitGroups([group('g1')]))
    expect(screen.getByText('ready:g1')).toBeInTheDocument()
    expect(watchMyGroups).toHaveBeenCalledWith('u1')
  })

  it('S-089 AC2: picks stored group, else legacy familyId, else the oldest', () => {
    localStorage.setItem('activeGroup:u1', 'g2')
    setup(profile('g3'), [group('g1', 0), group('g2', 1), group('g3', 2)])
    expect(screen.getByText('ready:g2')).toBeInTheDocument()
    expect(screen.getByText('groups:g1,g2,g3')).toBeInTheDocument()
  })

  it('S-089 AC2: legacy familyId when nothing stored', () => {
    setup(profile('g3'), [group('g1', 0), group('g3', 2)])
    expect(screen.getByText('ready:g3')).toBeInTheDocument()
  })

  it('S-089 AC2: oldest group when no stored nor legacy match', () => {
    setup(profile(null), [group('g1', 0), group('g2', 1)])
    expect(screen.getByText('ready:g1')).toBeInTheDocument()
  })

  it('S-089 AC3: setActiveGroup switches, persists per uid', () => {
    setup(profile(), [group('g1', 0), group('g2', 1)])
    act(() => screen.getByText('switch-g2').click())
    expect(screen.getByText('ready:g2')).toBeInTheDocument()
    expect(localStorage.getItem('activeGroup:u1')).toBe('g2')
  })

  it('S-089 AC4: runs ensureMemberProfile/openCycleIfNeeded once per group and drops the notice', async () => {
    openCycleIfNeeded.mockResolvedValueOnce({ added: 2 })
    setup(profile(), [group('g1', 0), group('g2', 1)])
    expect(ensureMemberProfile).toHaveBeenCalledWith('g1', 'u1', 'Ana')
    expect(openCycleIfNeeded).toHaveBeenCalledWith('g1', cycleOf(new Date()))
    expect(await screen.findByText('added:2')).toBeInTheDocument()
    act(() => screen.getByText('switch-g2').click())
    expect(screen.getByText('added:0')).toBeInTheDocument()
    expect(ensureMemberProfile).toHaveBeenCalledWith('g2', 'u1', 'Ana')
    expect(openCycleIfNeeded).toHaveBeenCalledWith('g2', cycleOf(new Date()))
    act(() => screen.getByText('switch-g1').click())
    expect(ensureMemberProfile).toHaveBeenCalledTimes(2)
    expect(openCycleIfNeeded).toHaveBeenCalledTimes(2)
  })

  it('S-089: switching keeps one groups listener, which is released on unmount', () => {
    watchMyGroups.mockClear()
    unsubscribeGroups.mockClear()
    const { unmount } = render(
      <FamilyProvider>
        <Probe />
      </FamilyProvider>,
    )
    act(() => emitUser(profile()))
    act(() => emitGroups([group('g1', 0), group('g2', 1)]))
    act(() => screen.getByText('switch-g2').click())
    expect(watchMyGroups).toHaveBeenCalledTimes(1)
    expect(unsubscribeGroups).not.toHaveBeenCalled()
    unmount()
    expect(unsubscribeGroups).toHaveBeenCalledTimes(1)
  })

  it('S-041 AC4: re-opens the cycle on the online event', () => {
    setup(profile(), [group('g1')])
    expect(openCycleIfNeeded).toHaveBeenCalledTimes(1)
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(openCycleIfNeeded).toHaveBeenCalledTimes(2)
  })

  it('S-089 AC5: a stored group that vanished falls back without error', () => {
    localStorage.setItem('activeGroup:u1', 'gone')
    setup(profile(), [group('g1', 0), group('g2', 1)])
    expect(screen.getByText('ready:g1')).toBeInTheDocument()
  })

  it('S-049 AC1: dismiss resets the recurring notice', async () => {
    openCycleIfNeeded.mockResolvedValueOnce({ added: 2 })
    setup(profile(), [group('g1')])
    expect(await screen.findByText('added:2')).toBeInTheDocument()
    act(() => screen.getByText('dismiss-notice').click())
    expect(screen.getByText('added:0')).toBeInTheDocument()
  })

  it('exposes an error state when the groups watch fails, and retry resubscribes', () => {
    watchMyGroups.mockClear()
    render(
      <FamilyProvider>
        <Probe />
      </FamilyProvider>,
    )
    act(() => failGroups())
    expect(screen.getByText('error:-')).toBeInTheDocument()
    act(() => screen.getByText('retry').click())
    expect(watchMyGroups).toHaveBeenCalledTimes(2)
    expect(screen.getByText('loading:-')).toBeInTheDocument()
  })
})
