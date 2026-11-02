import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { SuggestScreen } from './SuggestScreen'
import { CURRENT_MODEL } from '@/domain/listModels'
import { strings } from '@/strings/pt-BR'

const h = vi.hoisted(() => ({ read: vi.fn(), add: vi.fn() }))
vi.mock('@/data/suggested', () => ({ readGroupSnapshot: h.read, addSuggestedItems: h.add }))
vi.mock('@/app/AuthProvider', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))
vi.mock('@/app/FamilyProvider', () => ({ useFamily: () => ({ family: { id: 'g1' } }) }))

const t = strings.suggest
const total = CURRENT_MODEL.categories.flatMap((c) => c.items).length
const first = CURRENT_MODEL.categories[0]!

function renderIt() {
  return render(
    <MemoryRouter initialEntries={['/sugestao']}>
      <Routes>
        <Route path="/sugestao" element={<SuggestScreen />} />
        <Route path="/" element={<p>lista page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  localStorage.clear()
  h.add.mockReset()
  h.read.mockReset().mockResolvedValue({ hasItems: false, categories: [] })
})

describe('SuggestScreen', () => {
  it('S-111 AC2: all items start marked and the button counts them', async () => {
    renderIt()
    expect(await screen.findByRole('button', { name: t.add(total) })).toBeInTheDocument()
  })

  it('S-111 AC2: per-item and per-category selection update the counter', async () => {
    renderIt()
    await screen.findByRole('button', { name: t.add(total) })
    fireEvent.click(screen.getByRole('button', { name: new RegExp(first.name) }))
    fireEvent.click(screen.getByRole('checkbox', { name: first.items[0]! }))
    expect(screen.getByRole('button', { name: t.add(total - 1) })).toBeInTheDocument()
    const all = screen.getByRole('checkbox', { name: t.markAll(first.name) })
    fireEvent.click(all) // not all marked -> marks all
    expect(screen.getByRole('button', { name: t.add(total) })).toBeInTheDocument()
    fireEvent.click(all) // all marked -> clears category
    expect(screen.getByRole('button', { name: t.add(total - first.items.length) })).toBeVisible()
  })

  it('S-111 AC2: Adicionar sends the marked names and goes to the list', async () => {
    renderIt()
    await screen.findByRole('button', { name: t.add(total) })
    fireEvent.click(screen.getByRole('button', { name: t.add(total) }))
    expect(h.add).toHaveBeenCalledTimes(1)
    expect(h.add.mock.calls[0]![2].size).toBe(total)
    expect(screen.getByText('lista page')).toBeInTheDocument()
  })

  it('S-111 AC2: Começar vazia creates nothing and does not show again', async () => {
    renderIt()
    fireEvent.click(await screen.findByRole('button', { name: t.empty }))
    expect(h.add).not.toHaveBeenCalled()
    expect(screen.getByText('lista page')).toBeInTheDocument()
    renderIt()
    expect(screen.getAllByText('lista page')).toHaveLength(2)
  })

  it('S-111: a group that already has items skips the screen', async () => {
    h.read.mockResolvedValue({ hasItems: true, categories: [] })
    renderIt()
    await waitFor(() => expect(screen.getByText('lista page')).toBeInTheDocument())
  })

  it('S-111: a failed read (offline) skips the screen', async () => {
    h.read.mockRejectedValue(new Error('offline'))
    renderIt()
    await waitFor(() => expect(screen.getByText('lista page')).toBeInTheDocument())
  })
})
