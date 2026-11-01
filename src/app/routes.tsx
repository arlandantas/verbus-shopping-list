import { useEffect, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { useLocation } from 'react-router'
import { useAuth } from '@/app/AuthProvider'
import { FamilyProvider, useFamily } from '@/app/FamilyProvider'
import { CheckoutScreen } from '@/screens/Checkout/CheckoutScreen'
import { CategoriesScreen } from '@/screens/Categories/CategoriesScreen'
import { FamilyScreen } from '@/screens/Family/FamilyScreen'
import { ItemScreen } from '@/screens/Item/ItemScreen'
import { CycleScreen } from '@/screens/History/CycleScreen'
import { HistoryScreen } from '@/screens/History/HistoryScreen'
import { MarketScreen } from '@/screens/Market/MarketScreen'
import { PantryScreen } from '@/screens/Pantry/PantryScreen'
import { ListScreen } from '@/screens/List/ListScreen'
import { LoginScreen } from '@/screens/Login/LoginScreen'
import { InviteScreen } from '@/screens/Invite/InviteScreen'
import { peekReturnTo, saveReturnTo } from '@/app/returnTo'
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

/** Signed-in routes, guarded by family membership: no family -> only /familia. */
function FamilyRoutes(): ReactNode {
  const family = useFamily()
  const { status } = family
  if (status === 'loading') return <p className="p-4">{strings.loading}</p>
  if (status === 'error')
    return (
      <main className="mx-auto flex max-w-sm flex-col gap-4 p-4">
        <p role="alert">{strings.loadError}</p>
        <button
          type="button"
          onClick={family.retry}
          className="min-h-12 w-full rounded bg-green-700 px-4 text-base font-medium text-white"
        >
          {strings.retry}
        </button>
      </main>
    )
  return (
    <Routes>
      <Route
        path="/entrar"
        element={<AfterLogin fallback={status === 'ready' ? '/' : '/familia'} />}
      />
      <Route path="/convite/:code" element={<InviteScreen />} />
      <Route path="/familia" element={<FamilyScreen />} />
      {status === 'ready' && <Route path="/" element={<ListScreen />} />}
      {status === 'ready' && <Route path="/mercado" element={<MarketScreen />} />}
      {status === 'ready' && <Route path="/finalizar" element={<CheckoutScreen />} />}
      {status === 'ready' && <Route path="/historico" element={<HistoryScreen />} />}
      {status === 'ready' && <Route path="/historico/:cycle" element={<CycleScreen />} />}
      {status === 'ready' && <Route path="/despensa" element={<PantryScreen />} />}
      {status === 'ready' && <Route path="/categorias" element={<CategoriesScreen />} />}
      {status === 'ready' && <Route path="/item/:id" element={<ItemScreen />} />}
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
