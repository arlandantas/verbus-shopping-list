import '@testing-library/jest-dom/vitest'
import { act, render, screen } from '@testing-library/react'
import { reportWriteError } from '@/data/writeErrors'
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
vi.mock('@/data/catalog', () => ({ watchCatalog: () => () => undefined }))
vi.mock('@/data/categories', () => ({ watchCategories: () => () => undefined }))
vi.mock('@/data/members', () => ({ ensureMemberProfile: vi.fn() }))
vi.mock('@/data/cycles', () => ({ openCycleIfNeeded: () => Promise.resolve({ added: 0 }) }))
vi.mock('@/data/items', () => ({
  watchItems: () => () => undefined,
  addItem: vi.fn(),
  toggleItemStatus: vi.fn(),
}))

describe('App', () => {
  it('S-001 AC3: renders the title from pt-BR strings', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: strings.appTitle })).toBeInTheDocument()
  })

  it('ADR-0004: registers the write-error handler at the root (pt-BR alert)', async () => {
    render(<App />)
    await screen.findByRole('heading', { name: strings.appTitle })
    act(() => reportWriteError(new Error('permission-denied')))
    expect(screen.getByRole('alert')).toHaveTextContent(strings.writeError)
  })
})
