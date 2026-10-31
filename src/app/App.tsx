import { BrowserRouter } from 'react-router'
import { AuthProvider } from '@/app/AuthProvider'
import { AppRoutes } from '@/app/routes'
import { OfflineBadge } from '@/components/OfflineBadge'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <OfflineBadge />
      </AuthProvider>
    </BrowserRouter>
  )
}
