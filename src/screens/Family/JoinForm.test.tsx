import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { JoinForm } from './JoinForm'
import { strings } from '@/strings/pt-BR'

let online = false
vi.mock('@/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => online }))
const setActiveGroup = vi.fn()
vi.mock('@/app/FamilyProvider', () => ({ useFamily: () => ({ setActiveGroup }) }))
vi.mock('@/data/families', () => {
  class AlreadyMember extends Error {
    familyId: string
    constructor(familyId: string) {
      super()
      this.familyId = familyId
    }
  }
  return {
    joinFamilyByCode: vi.fn(),
    InviteNotFound: class extends Error {},
    AlreadyMember,
    GroupLimitReached: class extends Error {},
  }
})

describe('JoinForm offline', () => {
  it('disables joining and warns in pt-BR while offline', () => {
    online = false
    render(<JoinForm />)
    expect(screen.getByRole('button', { name: strings.family.join.submit })).toBeDisabled()
    expect(screen.getByText(strings.family.join.offlineWarning)).toBeInTheDocument()
  })
  it('shows no warning online', () => {
    online = true
    render(<JoinForm />)
    expect(screen.queryByText(strings.family.join.offlineWarning)).toBeNull()
  })
  it('S-064 AC2: code uses an M3 TextField and an outlined Button', () => {
    online = true
    render(<JoinForm />)
    expect(screen.getByLabelText(strings.family.join.codeLabel).closest('.m3-field')).not.toBeNull()
    expect(screen.getByRole('button', { name: strings.family.join.submit })).toHaveClass(
      'm3-btn--outlined',
    )
  })
})

describe('JoinForm errors (S-091)', () => {
  async function submit() {
    online = true
    render(<JoinForm />)
    fireEvent.change(screen.getByLabelText(strings.family.join.codeLabel), {
      target: { value: 'ABCD2345' },
    })
    fireEvent.click(screen.getByRole('button', { name: strings.family.join.submit }))
  }
  it('S-091 AC4: AlreadyMember switches to that group with a notice', async () => {
    const { joinFamilyByCode, AlreadyMember } = await import('@/data/families')
    vi.mocked(joinFamilyByCode).mockRejectedValueOnce(new AlreadyMember('gX'))
    await submit()
    expect(await screen.findByText(strings.invite.alreadyMember)).toBeInTheDocument()
    expect(setActiveGroup).toHaveBeenCalledWith('gX')
  })
  it('S-091 AC5: GroupLimitReached shows the limit message', async () => {
    const { joinFamilyByCode, GroupLimitReached } = await import('@/data/families')
    vi.mocked(joinFamilyByCode).mockRejectedValueOnce(new GroupLimitReached())
    await submit()
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(strings.invite.groupLimit),
    )
  })
})
