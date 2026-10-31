import { AuthProvider } from '@/app/AuthProvider'
import { Routes } from '@/app/routes'
import { OfflineBadge } from '@/components/OfflineBadge'

export function App() {
  return (
    <AuthProvider>
      <Routes />
      <OfflineBadge />
    </AuthProvider>
  )
}
