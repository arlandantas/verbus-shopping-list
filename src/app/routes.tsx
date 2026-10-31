import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from '@/app/AuthProvider'
import { LoginScreen } from '@/screens/Login/LoginScreen'
import { FamilyScreen } from '@/screens/Family/FamilyScreen'
import { strings } from '@/strings/pt-BR'

export function navigate(path: string): void {
  window.history.pushState(null, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function usePath(): string {
  const [path, setPath] = useState(() => window.location.pathname)
  useEffect(() => {
    const onPop = () => setPath(window.location.pathname)
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  return path
}

function Redirect({ to }: { to: string }) {
  const go = useCallback(() => {
    window.history.replaceState(null, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, [to])
  useEffect(go, [go])
  return null
}

/** Auth-guarded routes (ADR-0005): /entrar, /familia, / (list lands in later stories). */
export function Routes(): ReactNode {
  const { status } = useAuth()
  const path = usePath()
  if (status === 'loading') return <p className="p-4">{strings.loading}</p>
  if (status === 'signedOut')
    return path === '/entrar' ? <LoginScreen /> : <Redirect to="/entrar" />
  if (path === '/familia') return <FamilyScreen />
  return <Redirect to="/familia" />
}
