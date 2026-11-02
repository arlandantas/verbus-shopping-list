import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { useLocation } from 'react-router'
import { useAuth } from '@/app/AuthProvider'
import { FamilyProvider, useFamily } from '@/app/FamilyProvider'
import { AppShell } from '@/app/AppShell'
import { IosInstallHint } from '@/components/IosInstallHint'
import { CheckoutScreen } from '@/screens/Checkout/CheckoutScreen'
import { CategoriesScreen } from '@/screens/Categories/CategoriesScreen'
import { FamilyScreen } from '@/screens/Family/FamilyScreen'
import { CycleScreen } from '@/screens/History/CycleScreen'
import { HistoryScreen } from '@/screens/History/HistoryScreen'
import { PantryScreen } from '@/screens/Pantry/PantryScreen'
import { ListScreen } from '@/screens/List/ListScreen'
import { LandingScreen } from '@/screens/Landing/LandingScreen'
import { LoginScreen } from '@/screens/Login/LoginScreen'
import { InviteScreen } from '@/screens/Invite/InviteScreen'
import { peekReturnTo, saveReturnTo } from '@/app/returnTo'
import { Loading } from '@/components/Loading'
import { strings } from '@/strings/pt-BR'

/** Signed out on an invite link: remember it, go log in (S-012). */
function InviteLoginRedirect(): ReactNode {
  const { pathname } = useLocation()
  useEffect(() => saveReturnTo(pathname), [pathname])
  return <Navigate to="/entrar" replace />
}

/** Signed-in landing after login: back to the stored invite, else the family guard decides. */
function AfterLogin({ fallback }: { fallback: string }): ReactNode {
  return <Navigate to={peekReturnTo() ?? fallback} replace />
}

/** Signed-in routes, guarded by family membership: no family -> only /grupo. */
function FamilyRoutes(): ReactNode {
  const family = useFamily()
  const { status } = family
  if (status === 'loading') return <Loading />
  if (status === 'error')
    return (
      <main className="mx-auto flex max-w-sm flex-col gap-4 p-4">
        <p role="alert">{strings.loadError}</p>
        <button
          type="button"
          onClick={family.retry}
          className="min-h-12 w-full rounded bg-primary px-4 text-base font-medium text-on-primary"
        >
          {strings.retry}
        </button>
      </main>
    )
  return (
    <Routes key={family.family?.id}>
      <Route
        path="/entrar"
        element={<AfterLogin fallback={status === 'ready' ? '/' : '/grupo'} />}
      />
      <Route path="/convite/:code" element={<InviteScreen />} />
      {status === 'ready' ? (
        <Route element={<AppShell />}>
          <Route path="/grupo" element={<FamilyScreen />} />
          <Route path="/" element={<ListScreen />} />
          <Route path="/mercado" element={<Navigate to="/" replace />} />
          <Route path="/finalizar" element={<CheckoutScreen />} />
          <Route path="/historico" element={<HistoryScreen />} />
          <Route path="/historico/:cycle" element={<CycleScreen />} />
          <Route path="/despensa" element={<PantryScreen />} />
          <Route path="/categorias" element={<CategoriesScreen />} />
          <Route path="/item/:id" element={<Navigate to="/" replace />} />
        </Route>
      ) : (
        <Route
          path="/grupo"
          element={
            <>
              <IosInstallHint />
              <FamilyScreen />
            </>
          }
        />
      )}
      <Route path="/familia" element={<Navigate to="/grupo" replace />} />
      <Route path="*" element={<Navigate to={status === 'ready' ? '/' : '/grupo'} replace />} />
    </Routes>
  )
}

/** Auth-guarded routes (ADR-0005): /entrar, /grupo, / (list lands in later stories). */
export function AppRoutes(): ReactNode {
  const { status, user } = useAuth()
  if (status === 'loading') return <Loading />
  if (status === 'signedOut')
    return (
      <Routes>
        <Route path="/" element={<LandingScreen />} />
        <Route path="/entrar" element={<LoginScreen />} />
        <Route path="/convite/:code" element={<InviteLoginRedirect />} />
        <Route path="*" element={<Navigate to="/entrar" replace />} />
      </Routes>
    )
  return (
    <FamilyProvider key={user.uid}>
      <FamilyRoutes />
    </FamilyProvider>
  )
}
