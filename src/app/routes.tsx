import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from '@/app/AuthProvider'
import { FamilyProvider, useFamily } from '@/app/FamilyProvider'
import { FamilyScreen } from '@/screens/Family/FamilyScreen'
import { HomeScreen } from '@/screens/Home/HomeScreen'
import { LoginScreen } from '@/screens/Login/LoginScreen'
import { strings } from '@/strings/pt-BR'

/** Signed-in routes, guarded by family membership: no family -> only /familia. */
function FamilyRoutes(): ReactNode {
  const { status } = useFamily()
  if (status === 'loading') return <p className="p-4">{strings.loading}</p>
  return (
    <Routes>
      <Route path="/familia" element={<FamilyScreen />} />
      {status === 'ready' && <Route path="/" element={<HomeScreen />} />}
      <Route path="*" element={<Navigate to={status === 'ready' ? '/' : '/familia'} replace />} />
    </Routes>
  )
}

/** Auth-guarded routes (ADR-0005): /entrar, /familia, / (list lands in later stories). */
export function AppRoutes(): ReactNode {
  const { status, user } = useAuth()
  if (status === 'loading') return <p className="p-4">{strings.loading}</p>
  if (status === 'signedOut')
    return (
      <Routes>
        <Route path="/entrar" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    )
  return (
    <FamilyProvider key={user.uid}>
      <FamilyRoutes />
    </FamilyProvider>
  )
}
