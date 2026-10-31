import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { App } from '@/app/App'
import { strings } from '@/strings/pt-BR'

describe('App', () => {
  it('S-001 AC3: renders the title from pt-BR strings', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: strings.appTitle })).toBeInTheDocument()
  })
})
