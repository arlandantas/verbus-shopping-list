import '@testing-library/jest-dom/vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { InviteScreen } from './InviteScreen'
import { strings } from '@/strings/pt-BR'

vi.mock('@/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => false }))
vi.mock('@/app/FamilyProvider', () => ({ useFamily: () => ({ status: 'none', family: null }) }))
vi.mock('@/data/families', () => ({
  joinFamilyByCode: vi.fn(),
  getInvitePreview: () => Promise.resolve({ familyId: 'f', familyName: 'Casa' }),
  InviteNotFound: class extends Error {},
  AlreadyInFamily: class extends Error {},
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
})
