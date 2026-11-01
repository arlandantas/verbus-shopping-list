import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { InviteScreen } from './InviteScreen'
import { strings } from '@/strings/pt-BR'

let online = false
vi.mock('@/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => online }))
let familyStatus = 'none'
const setActiveGroup = vi.fn()
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ status: familyStatus, family: null, setActiveGroup }),
}))
vi.mock('@/data/families', () => ({
  joinFamilyByCode: vi.fn(),
  getInvitePreview: () => Promise.resolve({ familyId: 'f', familyName: 'Casa' }),
  InviteNotFound: class extends Error {},
  AlreadyMember: class extends Error {
    familyId: string
    constructor(familyId: string) {
      super()
      this.familyId = familyId
    }
  },
  GroupLimitReached: class extends Error {},
}))

describe('InviteScreen offline', () => {
  it('disables confirm and warns in pt-BR while offline', async () => {
    render(
      <MemoryRouter>
        <InviteScreen />
      </MemoryRouter>,
    )
    const btn = await waitFor(() => screen.getByRole('button', { name: strings.invite.confirm }))
    expect(btn).toBeDisabled()
    expect(screen.getByText(strings.invite.offlineWarning)).toBeInTheDocument()
  })
  it('S-064 AC4: shows the family name and a filled M3 confirm button', async () => {
    render(
      <MemoryRouter>
        <InviteScreen />
      </MemoryRouter>,
    )
    const btn = await waitFor(() => screen.getByRole('button', { name: strings.invite.confirm }))
    expect(btn).toHaveClass('m3-btn--filled')
    expect(screen.getByRole('heading', { name: strings.invite.title('Casa') })).toBeInTheDocument()
  })
  it('S-089: a user who already has a group still previews the invite and joins, activating the new group', async () => {
    familyStatus = 'ready'
    online = true
    const { joinFamilyByCode } = await import('@/data/families')
    vi.mocked(joinFamilyByCode).mockResolvedValueOnce({ familyId: 'f' })
    render(
      <MemoryRouter>
        <InviteScreen />
      </MemoryRouter>,
    )
    const btn = await waitFor(() => screen.getByRole('button', { name: strings.invite.confirm }))
    btn.click()
    await waitFor(() => expect(setActiveGroup).toHaveBeenCalledWith('f'))
    familyStatus = 'none'
    online = false
  })
})

describe('InviteScreen errors (S-091)', () => {
  async function confirmWith(err: Error) {
    familyStatus = 'ready'
    online = true
    const { joinFamilyByCode } = await import('@/data/families')
    vi.mocked(joinFamilyByCode).mockRejectedValueOnce(err)
    render(
      <MemoryRouter>
        <InviteScreen />
      </MemoryRouter>,
    )
    const btn = await waitFor(() => screen.getByRole('button', { name: strings.invite.confirm }))
    btn.click()
  }
  afterEach(() => {
    familyStatus = 'none'
    online = false
    setActiveGroup.mockClear()
  })
  it('S-091 AC4: AlreadyMember switches to that group without an error', async () => {
    const { AlreadyMember } = await import('@/data/families')
    await confirmWith(new AlreadyMember('gX'))
    await waitFor(() => expect(setActiveGroup).toHaveBeenCalledWith('gX'))
    expect(screen.queryByRole('alert')).toBeNull()
  })
  it('S-091 AC5: GroupLimitReached shows the limit message', async () => {
    const { GroupLimitReached } = await import('@/data/families')
    await confirmWith(new GroupLimitReached())
    expect(await screen.findByRole('alert')).toHaveTextContent(strings.invite.groupLimit)
    expect(setActiveGroup).not.toHaveBeenCalled()
  })
})
