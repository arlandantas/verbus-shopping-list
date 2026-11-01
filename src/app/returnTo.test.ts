import { clearReturnTo, peekReturnTo, saveReturnTo } from '@/app/returnTo'

beforeEach(() => sessionStorage.clear())

describe('S-012 AC5: post-login return route', () => {
  it('preserves /convite/:code across the login detour', () => {
    saveReturnTo('/convite/ABCD2345')
    expect(peekReturnTo()).toBe('/convite/ABCD2345')
    expect(peekReturnTo()).toBe('/convite/ABCD2345') // peeking does not consume
    clearReturnTo()
    expect(peekReturnTo()).toBeNull()
  })

  it('ignores anything that is not an invite path (no open redirects)', () => {
    saveReturnTo('https://evil.example/convite/ABCD2345')
    expect(peekReturnTo()).toBeNull()
    sessionStorage.setItem('returnTo', '//evil.example')
    expect(peekReturnTo()).toBeNull()
    sessionStorage.setItem('returnTo', '/grupo')
    expect(peekReturnTo()).toBeNull()
  })
})
