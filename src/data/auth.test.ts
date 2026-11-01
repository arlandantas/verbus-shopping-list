import { authErrorMessage } from '@/data/auth'
import { devStrings, strings } from '@/strings/pt-BR'

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

  describe('emulator mode network errors', () => {
    afterEach(() => vi.unstubAllEnvs())
    const netErr = { code: 'auth/network-request-failed' }

    it('shows the "emulator not found" hint when the emulator is on', () => {
      vi.stubEnv('VITE_USE_EMULATOR', 'true')
      expect(authErrorMessage(netErr)).toBe(devStrings.emulatorNotFound)
      expect(authErrorMessage({ code: 'auth/invalid-credential' })).toBe(
        strings.authErrors['auth/invalid-credential'],
      )
    })

    it('keeps the generic offline message outside emulator mode', () => {
      vi.stubEnv('VITE_USE_EMULATOR', 'false')
      expect(authErrorMessage(netErr)).toBe(strings.authErrors['auth/network-request-failed'])
    })
  })
})
