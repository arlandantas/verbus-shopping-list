import '@testing-library/jest-dom/vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LoginScreen } from './LoginScreen'
import { strings } from '@/strings/pt-BR'

const h = vi.hoisted(() => ({ signInWithEmail: vi.fn(), signInWithGoogle: vi.fn() }))
vi.mock('@/data/auth', () => ({
  signInWithEmail: h.signInWithEmail,
  signInWithGoogle: h.signInWithGoogle,
  signUpWithEmail: vi.fn(),
  authErrorMessage: () => 'falhou',
}))

describe('LoginScreen (S-064 AC1)', () => {
  it('uses M3 fields and buttons, with a clear Google label', () => {
    render(<LoginScreen />)
    expect(screen.getByLabelText(strings.login.email).closest('.m3-field')).not.toBeNull()
    expect(screen.getByLabelText(strings.login.password).closest('.m3-field')).not.toBeNull()
    expect(screen.getByRole('button', { name: strings.login.signIn })).toHaveClass('m3-btn--filled')
    expect(screen.getByRole('button', { name: strings.login.signUp })).toHaveClass(
      'm3-btn--outlined',
    )
    expect(screen.getByRole('button', { name: strings.login.google })).toHaveClass(
      'm3-btn--outlined',
    )
  })

  it('announces errors with role=alert', async () => {
    h.signInWithEmail.mockRejectedValueOnce(new Error('x'))
    render(<LoginScreen />)
    fireEvent.click(screen.getByRole('button', { name: strings.login.signIn }))
    expect(await screen.findByRole('alert')).toHaveTextContent('falhou')
    await waitFor(() => expect(h.signInWithEmail).toHaveBeenCalled())
  })
})
