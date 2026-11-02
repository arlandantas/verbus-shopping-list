import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { WelcomeScreen } from './WelcomeScreen'
import { strings } from '@/strings/pt-BR'

const h = vi.hoisted(() => ({ on: true, set: vi.fn(() => Promise.resolve()) }))
vi.mock('@/data/families', () => ({ setRecurringEnabled: h.set }))
vi.mock('@/app/AuthProvider', () => ({ useAuth: () => ({ user: { uid: 'u1' } }) }))
vi.mock('@/app/FamilyProvider', () => ({
  useFamily: () => ({ family: { id: 'g1', recurringEnabled: h.on } }),
}))

const t = strings.welcome
function renderIt() {
  return render(
    <MemoryRouter initialEntries={['/boas-vindas']}>
      <Routes>
        <Route path="/boas-vindas" element={<WelcomeScreen />} />
        <Route path="/sugestao" element={<p>lista page</p>} />
      </Routes>
    </MemoryRouter>,
  )
}
const skip = () => screen.getByRole('button', { name: t.skip })
const next = () => fireEvent.click(screen.getByRole('button', { name: t.next }))

beforeEach(() => {
  localStorage.clear()
  h.on = true
  h.set.mockClear()
})

describe('WelcomeScreen', () => {
  it('S-110 AC1: three steps navigate forward/back and Pular is on every step', () => {
    renderIt()
    for (const [i, s] of t.steps.entries()) {
      expect(screen.getByRole('heading', { name: s.title })).toBeInTheDocument()
      expect(skip()).toBeInTheDocument()
      if (i < 2) next()
    }
    fireEvent.click(screen.getByRole('button', { name: t.back }))
    expect(screen.getByRole('heading', { name: t.steps[1]?.title })).toBeInTheDocument()
  })

  it('S-110 AC1: skip and finish go to the list; seen is stored and the screen does not reappear', () => {
    renderIt()
    fireEvent.click(skip())
    expect(screen.getByText('lista page')).toBeInTheDocument()
    expect(localStorage.getItem('welcomeSeen:u1:g1')).not.toBeNull()
    renderIt()
    expect(screen.getAllByText('lista page').length).toBe(2)
  })

  it('S-110 AC1: finishing on the last step goes to the list', () => {
    renderIt()
    next()
    next()
    fireEvent.click(screen.getByRole('button', { name: t.done }))
    expect(screen.getByText('lista page')).toBeInTheDocument()
  })

  it('S-110 AC2: toggle off offers activate and persists via setRecurringEnabled', () => {
    h.on = false
    renderIt()
    next()
    next()
    fireEvent.click(screen.getByRole('button', { name: t.activate }))
    expect(h.set).toHaveBeenCalledWith('g1', true)
    expect(screen.getByText(t.activated)).toBeInTheDocument()
  })

  it('S-110 AC2: toggle on only explains', () => {
    renderIt()
    next()
    next()
    expect(screen.queryByRole('button', { name: t.activate })).toBeNull()
    expect(screen.getByText(t.steps[2]!.text)).toBeInTheDocument()
  })
})
