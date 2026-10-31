import type { ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from '@/app/AuthProvider'
import { LoginScreen } from '@/screens/Login/LoginScreen'
import { FamilyScreen } from '@/screens/Family/FamilyScreen'
import { strings } from '@/strings/pt-BR'

/** Auth-guarded routes (ADR-0005): /entrar, /familia, / (list lands in later stories). */
export function AppRoutes(): ReactNode {
  const { status } = useAuth()
  if (status === 'loading') return <p className="p-4">{strings.loading}</p>
  if (status === 'signedOut')
    return (
      <Routes>
        <Route path="/entrar" element={<LoginScreen />} />
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    )
  return (
    <Routes>
      <Route path="/familia" element={<FamilyScreen />} />
      <Route path="*" element={<Navigate to="/familia" replace />} />
    </Routes>
  )
}
