import '@testing-library/jest-dom/vitest'
import { render, screen } from '@testing-library/react'
import { App } from '@/app/App'
import { strings } from '@/strings/pt-BR'

vi.mock('@/data/auth', () => ({
  watchAuth: (cb: (u: null) => void) => {
    cb(null)
    return () => undefined
  },
  authErrorMessage: () => '',
  signInWithEmail: vi.fn(),
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('@/data/users', () => ({ watchUser: () => () => undefined }))
vi.mock('@/data/families', () => ({ watchFamily: () => () => undefined, createFamily: vi.fn() }))
vi.mock('@/data/items', () => ({
  watchItems: () => () => undefined,
  addItem: vi.fn(),
  setItemStatus: vi.fn(),
}))

describe('App', () => {
  it('S-001 AC3: renders the title from pt-BR strings', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: strings.appTitle })).toBeInTheDocument()
  })
})
