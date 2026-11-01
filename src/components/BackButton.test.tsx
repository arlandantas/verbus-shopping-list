import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { BackButton } from './BackButton'

describe('BackButton', () => {
  it('S-053 AC4: "Voltar" icon button navigates to the parent screen', () => {
    render(
      <MemoryRouter initialEntries={['/categorias']}>
        <Routes>
          <Route path="/categorias" element={<BackButton to="/grupo" />} />
          <Route path="/grupo" element={<p>mae</p>} />
        </Routes>
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))
    expect(screen.getByText('mae')).toBeInTheDocument()
  })
})
