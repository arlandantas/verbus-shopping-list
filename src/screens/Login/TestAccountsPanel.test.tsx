import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { TEST_ACCOUNTS } from '../../../scripts/seed/accounts.ts'
import { devStrings } from '@/strings/pt-BR'

const signInWithEmail = vi.fn((email: string, password: string) =>
  Promise.resolve([email, password]).then(() => undefined),
)
vi.mock('@/data/auth', () => ({
  signInWithEmail: (...a: unknown[]) => signInWithEmail(...(a as [string, string])),
  signUpWithEmail: vi.fn(),
  signInWithGoogle: vi.fn(),
  authErrorMessage: (e: unknown) => (e as { code?: string }).code ?? 'erro',
}))

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
  signInWithEmail.mockClear()
})

describe('S-050 AC4: test accounts panel', () => {
  it('S-050 AC4: one big button per account; click signs in through data/auth', async () => {
    const { TestAccountsPanel } = await import('./TestAccountsPanel')
    render(<TestAccountsPanel />)
    expect(screen.getByText(devStrings.testAccounts)).toBeInTheDocument()
    for (const a of TEST_ACCOUNTS) {
      const btn = screen.getByRole('button', { name: new RegExp(a.displayName) })
      expect(btn.className).toContain('min-h-12')
    }
    const first = TEST_ACCOUNTS[0]
    fireEvent.click(screen.getByRole('button', { name: new RegExp(first.displayName) }))
    await waitFor(() => expect(signInWithEmail).toHaveBeenCalledWith(first.email, first.password))
  })

  it('S-050 AC4: LoginScreen shows the panel only when VITE_USE_EMULATOR is true', async () => {
    vi.stubEnv('VITE_USE_EMULATOR', 'true')
    vi.resetModules()
    const on = await import('./LoginScreen')
    const view = render(<on.LoginScreen />)
    expect(await screen.findByText(devStrings.testAccounts)).toBeInTheDocument()
    view.unmount()

    vi.stubEnv('VITE_USE_EMULATOR', 'false')
    vi.resetModules()
    const off = await import('./LoginScreen')
    render(<off.LoginScreen />)
    expect(screen.queryByText(devStrings.testAccounts)).not.toBeInTheDocument()
  })

  it('shows the error from authErrorMessage when quick login fails', async () => {
    signInWithEmail.mockRejectedValueOnce({ code: 'auth/network-request-failed' })
    const { TestAccountsPanel } = await import('./TestAccountsPanel')
    render(<TestAccountsPanel />)
    fireEvent.click(screen.getByRole('button', { name: new RegExp(TEST_ACCOUNTS[0].displayName) }))
    expect(await screen.findByRole('alert')).toHaveTextContent('auth/network-request-failed')
  })
})
