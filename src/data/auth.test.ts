import { authErrorMessage } from '@/data/auth'
import { strings } from '@/strings/pt-BR'

vi.mock('@/data/firebase', () => ({ auth: {}, db: {} }))
vi.mock('firebase/auth', () => ({}))

describe('authErrorMessage', () => {
  it('S-010 AC4: maps auth codes to pt-BR and hides unknown/English text', () => {
    expect(authErrorMessage({ code: 'auth/invalid-credential' })).toBe(
      strings.authErrors['auth/invalid-credential'],
    )
    expect(authErrorMessage({ code: 'auth/weird', message: 'Firebase: Error' })).toBe(
      strings.authErrors.unknown,
    )
    expect(authErrorMessage(new Error('boom'))).toBe(strings.authErrors.unknown)
  })
})
