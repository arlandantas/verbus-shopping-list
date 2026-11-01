import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { strings } from '@/strings/pt-BR'

export function OfflineBadge() {
  const online = useOnlineStatus()
  if (online) return null
  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[var(--app-bottom-inset,0px)] bg-inverse-surface px-4 py-3 text-center text-sm text-inverse-on-surface"
    >
      {strings.offline}
    </div>
  )
}
