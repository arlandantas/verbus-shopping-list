import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AppShell } from '@/app/AppShell'

const h = vi.hoisted(() => ({ family: null as { recurringEnabled: boolean } | null }))
vi.mock('@/app/FamilyProvider', () => ({ useFamily: () => ({ family: h.family }) }))

function at(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="*" element={<p>conteudo</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AppShell recurrence (S-105 AC2)', () => {
  afterEach(() => {
    h.family = null
  })
  it('absent/legacy counts as on: Despensa tab present', () => {
    at('/')
    expect(screen.getByRole('link', { name: 'Despensa' })).toBeInTheDocument()
  })
  it('off: no Despensa tab', () => {
    h.family = { recurringEnabled: false }
    at('/')
    expect(screen.queryByRole('link', { name: 'Despensa' })).not.toBeInTheDocument()
    expect(
      screen.getByRole('navigation', { name: 'Principal' }).querySelectorAll('a'),
    ).toHaveLength(3)
  })
})

describe('AppShell', () => {
  it('S-053 AC1: renders outlet and the four tabs', () => {
    at('/')
    expect(screen.getByText('conteudo')).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Principal' })
    expect(nav.querySelectorAll('a')).toHaveLength(4)
  })

  it.each([
    ['/', 'Lista'],
    ['/finalizar', 'Lista'],
    ['/despensa', 'Despensa'],
    ['/historico', 'Histórico'],
    ['/historico/2026-10', 'Histórico'],
    ['/grupo', 'Grupo'],
    ['/categorias', 'Grupo'],
  ])('S-053 AC1: %s activates %s', (path, tab) => {
    at(path)
    const active = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('aria-current') === 'page')
    expect(active.map((a) => a.textContent)).toEqual([tab])
  })
})
