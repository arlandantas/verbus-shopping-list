import '@testing-library/jest-dom/vitest'
import { act, render, screen } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/app/AuthProvider'
import type { AuthUser } from '@/data/auth'

let emit: (u: AuthUser | null) => void = () => undefined
vi.mock('@/data/auth', () => ({
  watchAuth: (cb: (u: AuthUser | null) => void) => {
    emit = cb
    return () => undefined
  },
}))

function Probe() {
  const { status, user } = useAuth()
  return <p>{`${status}:${user?.uid ?? '-'}`}</p>
}

describe('AuthProvider', () => {
  it('S-010 AC5: exposes loading, signedIn and signedOut', () => {
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(screen.getByText('loading:-')).toBeInTheDocument()
    act(() => emit({ uid: 'u1', displayName: 'A', email: 'a@b.co' }))
    expect(screen.getByText('signedIn:u1')).toBeInTheDocument()
    act(() => emit(null))
    expect(screen.getByText('signedOut:-')).toBeInTheDocument()
  })
})
