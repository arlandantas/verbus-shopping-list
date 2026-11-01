import { useRegisterSW } from 'virtual:pwa-register/react'
import { Snackbar } from '@/components/m3/Snackbar'
import { startUpdateChecks } from '@/pwa/updateChecks'
import { strings } from '@/strings/pt-BR'

/** Offers a new app version without reloading by itself (pending writes survive: ADR-0004). */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (registration) startUpdateChecks(registration)
    },
  })
  if (!needRefresh && !offlineReady) return null
  // Same stacking as other notices: above the bottom inset and the add bar.
  return (
    <div
      style={{
        ['--snackbar-offset' as string]:
          'calc(var(--app-bottom-inset, 0px) + var(--add-bar-zone, 0px))',
      }}
    >
      {needRefresh ? (
        <Snackbar
          message={strings.update.available}
          actionLabel={strings.update.action}
          onAction={() => void updateServiceWorker(true)}
          onDismiss={() => setNeedRefresh(false)}
          duration={15000}
        />
      ) : (
        <Snackbar message={strings.update.offlineReady} onDismiss={() => setOfflineReady(false)} />
      )}
    </div>
  )
}
