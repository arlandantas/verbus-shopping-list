import { BrowserRouter } from 'react-router'
import { AuthProvider } from '@/app/AuthProvider'
import { AppRoutes } from '@/app/routes'
import { WriteErrorNotice } from '@/components/WriteErrorNotice'
import { OfflineBadge } from '@/components/OfflineBadge'

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <OfflineBadge />
        <WriteErrorNotice />
      </AuthProvider>
    </BrowserRouter>
  )
}
