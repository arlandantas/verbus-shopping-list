import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { AppShell } from '@/app/AppShell'

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
