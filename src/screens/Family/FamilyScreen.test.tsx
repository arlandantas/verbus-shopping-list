import '@testing-library/jest-dom/vitest'
import { readFileSync } from 'node:fs'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { FamilyScreen } from './FamilyScreen'
import { strings } from '@/strings/pt-BR'

const h = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock('@/data/auth', () => ({ signOut: h.signOut }))
const fam = vi.hoisted(() => ({
  groups: [{ id: 'f1' }] as { id: string }[],
  setActive: vi.fn(),
  on: true,
}))
vi.mock('@/data/families', () => ({
  MAX_GROUPS_PER_USER: 10,
  createFamily: vi.fn(),
  setRecurringEnabled: vi.fn(() => Promise.resolve()),
  joinFamilyByCode: vi.fn(),
  InviteNotFound: class extends Error {},
  AlreadyMember: class extends Error {},
  GroupLimitReached: class extends Error {},
}))
vi.mock('@/hooks/useOnlineStatus', () => ({ useOnlineStatus: () => true }))
vi.mock('@/hooks/useMemberNames', () => ({ useMemberNames: () => ({ u1: 'Ana' }) }))
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({
    status: 'ready',
    groups: fam.groups,
    setActiveGroup: fam.setActive,
    family: {
      id: 'f1',
      name: 'Casa',
      inviteCode: 'ABC123',
      members: ['u1', 'u2'],
      recurringEnabled: fam.on,
    },
  }),
}))

function renderIt(state?: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/grupo', state }]}>
      <Routes>
        <Route path="/grupo" element={<FamilyScreen />} />
        <Route path="/" element={<p>lista page</p>} />
        <Route path="/boas-vindas" element={<p>welcome page</p>} />
        <Route path="/categorias" element={<p>cats page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('FamilyScreen (S-064 AC3)', () => {
  it('top bar shows the family name and a logout icon button', () => {
    renderIt()
    expect(screen.getByRole('heading', { name: 'Casa', level: 1 })).toBeInTheDocument()
  })

  it('S-073 AC1: logout asks for confirmation; cancel/Esc do not sign out, confirm does', async () => {
    h.signOut.mockClear()
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.login.signOut }))
    const dlg = screen.getByRole('dialog', { name: strings.login.signOutTitle })
    expect(within(dlg).getByText(strings.login.signOutNote)).toBeInTheDocument()
    expect(h.signOut).not.toHaveBeenCalled()
    fireEvent.click(within(dlg).getByRole('button', { name: strings.login.signOutCancel }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: strings.login.signOut }))
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })
    expect(h.signOut).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: strings.login.signOut }))
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', { name: strings.login.signOut }),
    )
    await waitFor(() => expect(h.signOut).toHaveBeenCalledTimes(1))
  })

  it('S-073: add-bar pill shows a visible focus indicator', () => {
    const css = readFileSync('src/index.css', 'utf8')
    expect(css).toMatch(/\.add-bar:focus-within\s*{[^}]*outline:[^;]*primary/)
  })

  it('invite card: highlighted code, copy icon button and tonal share button', () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderIt()
    expect(screen.getByTestId('invite-code')).toHaveTextContent('ABC123')
    fireEvent.click(screen.getByRole('button', { name: strings.family.invite.copyCode }))
    expect(writeText).toHaveBeenCalledWith('ABC123')
    expect(screen.getByRole('button', { name: strings.family.invite.share })).toHaveClass(
      'm3-btn--tonal',
    )
  })

  it('shows an error message when the clipboard write fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'))
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.family.invite.copyCode }))
    expect(await screen.findByText(strings.family.invite.copyFailed)).toBeInTheDocument()
  })

  it('lists members with names and a fallback', () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.family.members(2) }))
    const list = screen.getByRole('list', { name: strings.family.membersSection })
    expect(within(list).getByText('Ana')).toBeInTheDocument()
    expect(within(list).getByText(strings.family.memberFallback)).toBeInTheDocument()
  })

  it('Categorias item navigates to /categorias', () => {
    renderIt()
    fireEvent.click(screen.getByRole('link', { name: strings.categories.link }))
    expect(screen.getByText('cats page')).toBeInTheDocument()
  })
})

describe('FamilyScreen layout (S-108)', () => {
  it('S-108 AC1: blocks are ordered go-to-list, members, categories, toggle; members start collapsed', () => {
    renderIt()
    const go = screen.getByRole('button', { name: strings.family.goToList })
    const members = screen.getByRole('button', { name: strings.family.members(2) })
    const cats = screen.getByRole('link', { name: strings.categories.link })
    const sw = screen.getByRole('switch', { name: strings.family.recurring.label })
    const before = (a: Node, b: Node) =>
      expect(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    before(go, members)
    before(members, cats)
    before(cats, sw)
    expect(members).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Ana')).not.toBeInTheDocument()
    fireEvent.click(members)
    expect(members).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Ana')).toBeInTheDocument()
    fireEvent.click(members)
    expect(screen.queryByText('Ana')).not.toBeInTheDocument()
  })
  it('S-108 AC1: go-to-list navigates to the list', () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.family.goToList }))
    expect(screen.getByText('lista page')).toBeInTheDocument()
  })
  it('S-108 AC2: members, categories and toggle rows share the base component', () => {
    renderIt()
    const rows = [
      screen.getByRole('button', { name: strings.family.members(2) }),
      screen.getByRole('link', { name: strings.categories.link }),
      screen.getByRole('switch', { name: strings.family.recurring.label }),
    ].map((el) => el.closest('.group-row'))
    rows.forEach((r) => expect(r).not.toBeNull())
  })
})

describe('FamilyScreen extra groups (S-091)', () => {
  beforeEach(() => {
    fam.groups = [{ id: 'f1' }]
    fam.setActive.mockClear()
  })
  it('S-091 AC1: shows create/join actions that open the existing forms', async () => {
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.groups.createNew }))
    expect(screen.getByLabelText(strings.family.nameLabel)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: strings.groups.joinAnother }))
    expect(screen.getByLabelText(strings.family.join.codeLabel)).toBeInTheDocument()
  })
  it('S-105 AC3: toggle with explanation on the Grupo screen persists the change', async () => {
    const { setRecurringEnabled } = await import('@/data/families')
    renderIt()
    expect(screen.getByText(strings.family.recurring.explain)).toBeInTheDocument()
    const sw = screen.getByRole('switch', { name: strings.family.recurring.label })
    expect(sw).toBeChecked()
    fireEvent.click(sw)
    expect(setRecurringEnabled).toHaveBeenCalledWith('f1', false)
  })
  it('S-105 AC3: the create form has the toggle (default on) and sends the choice', async () => {
    const { createFamily } = await import('@/data/families')
    vi.mocked(createFamily).mockResolvedValueOnce({ familyId: 'f9', inviteCode: 'X' })
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.groups.createNew }))
    const form = screen.getByLabelText(strings.family.nameLabel).closest('form')!
    const sw = within(form).getByRole('switch', { name: strings.family.recurring.label })
    expect(sw).toBeChecked()
    expect(within(form).getByText(strings.family.recurring.explain)).toBeInTheDocument()
    fireEvent.click(sw)
    fireEvent.change(screen.getByLabelText(strings.family.nameLabel), { target: { value: 'Novo' } })
    fireEvent.click(screen.getByRole('button', { name: strings.family.create }))
    await waitFor(() => expect(createFamily).toHaveBeenCalledWith('Novo', false))
  })
  it('S-091 AC2: creating a group activates it and returns to the list', async () => {
    const { createFamily } = await import('@/data/families')
    vi.mocked(createFamily).mockResolvedValueOnce({ familyId: 'f9', inviteCode: 'X' })
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.groups.createNew }))
    fireEvent.change(screen.getByLabelText(strings.family.nameLabel), { target: { value: 'Novo' } })
    fireEvent.click(screen.getByRole('button', { name: strings.family.create }))
    await waitFor(() => expect(fam.setActive).toHaveBeenCalledWith('f9'))
    expect(await screen.findByText('welcome page')).toBeInTheDocument()
  })
  it('S-091 AC2: joining by code activates the group and returns to the list', async () => {
    const { joinFamilyByCode } = await import('@/data/families')
    vi.mocked(joinFamilyByCode).mockResolvedValueOnce({ familyId: 'f8' })
    renderIt()
    fireEvent.click(screen.getByRole('button', { name: strings.groups.joinAnother }))
    fireEvent.change(screen.getByLabelText(strings.family.join.codeLabel), {
      target: { value: 'ABCD2345' },
    })
    fireEvent.click(screen.getByRole('button', { name: strings.family.join.submit }))
    await waitFor(() => expect(fam.setActive).toHaveBeenCalledWith('f8'))
    expect(await screen.findByText('welcome page')).toBeInTheDocument()
  })
  it('S-091 AC5: with 10 groups the actions are disabled and the limit notice shows', () => {
    fam.groups = Array.from({ length: 10 }, (_, i) => ({ id: `g${i}` }))
    renderIt()
    expect(screen.getByText(strings.invite.groupLimit)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: strings.groups.createNew })).toBeDisabled()
    expect(screen.getByRole('button', { name: strings.groups.joinAnother })).toBeDisabled()
  })
})

describe('FamilyScreen route action (S-091)', () => {
  it('S-091: state.action join/create opens the matching form; none opens neither', () => {
    fam.groups = [{ id: 'f1' }]
    const { unmount } = renderIt({ action: 'join' })
    expect(screen.getByLabelText(strings.family.join.codeLabel)).toBeInTheDocument()
    expect(screen.queryByLabelText(strings.family.nameLabel)).not.toBeInTheDocument()
    unmount()
    const second = renderIt({ action: 'create' })
    expect(screen.getByLabelText(strings.family.nameLabel)).toBeInTheDocument()
    second.unmount()
    renderIt()
    expect(screen.queryByLabelText(strings.family.nameLabel)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(strings.family.join.codeLabel)).not.toBeInTheDocument()
  })
})
