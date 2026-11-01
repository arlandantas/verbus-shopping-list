import { BrowserRouter } from 'react-router'
import { AuthProvider } from '@/app/AuthProvider'
import { AppRoutes } from '@/app/routes'
import { WriteErrorNotice } from '@/components/WriteErrorNotice'
import { UpdatePrompt } from '@/components/UpdatePrompt'
import { OfflineBadge } from '@/components/OfflineBadge'

export function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <AppRoutes />
        <OfflineBadge />
        <WriteErrorNotice />
        <UpdatePrompt />
      </AuthProvider>
    </BrowserRouter>
  )
}
