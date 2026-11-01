import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { JoinForm } from './JoinForm'
import { strings } from '@/strings/pt-BR'

let online = false
vi.mock('@/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => online }))
vi.mock('@/data/families', () => ({
  joinFamilyByCode: vi.fn(),
  InviteNotFound: class extends Error {},
  AlreadyInFamily: class extends Error {},
}))

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
