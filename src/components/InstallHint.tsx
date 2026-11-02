import { useState, useSyncExternalStore, type ReactNode } from 'react'
import { detectInstallPlatform, dismissHint, shouldShowInstallHint } from '@/pwa/installHint'
import { canPromptInstall, promptInstall, subscribeInstallPrompt } from '@/pwa/installPrompt'
import { strings } from '@/strings/pt-BR'

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={20}
      height={20}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="inline-block align-text-bottom"
    >
      <path d="M12 15V3M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  )
}

const s = strings.install

/** Steps for the current browser; null for the one-tap `beforeinstallprompt` case. */
function steps(platform: ReturnType<typeof detectInstallPlatform>): ReactNode {
  switch (platform) {
    case 'ios-safari':
      return (
        <>
          {s.iosSafari.before} <strong>{s.iosSafari.share}</strong> <ShareIcon /> {s.iosSafari.then}{' '}
          <strong>{s.iosSafari.add}</strong>.
        </>
      )
    case 'ios-other':
      return s.iosOther
    case 'mac-safari':
      return (
        <>
          {s.macSafari.before} <strong>{s.macSafari.share}</strong> <ShareIcon /> {s.macSafari.then}{' '}
          <strong>{s.macSafari.add}</strong>.
        </>
      )
    case 'android-firefox':
      return (
        <>
          {s.androidFirefox.before} <strong>{s.androidFirefox.menu}</strong> {s.androidFirefox.then}{' '}
          <strong>{s.androidFirefox.add}</strong>.
        </>
      )
    default:
      return s.prompt
  }
}

/** In-flow card teaching how to install the app on the current browser; dismissal is remembered. */
export function InstallHint() {
  const canPrompt = useSyncExternalStore(subscribeInstallPrompt, canPromptInstall)
  const [dismissed, setDismissed] = useState(false)
  if (dismissed || !shouldShowInstallHint(window, canPrompt)) return null
  const platform = detectInstallPlatform(window.navigator)
  const close = () => {
    dismissHint()
    setDismissed(true)
  }
  return (
    <div
      role="note"
      className="mx-4 my-2 flex items-center gap-2 rounded border border-outline bg-secondary-container px-3 py-2 text-sm text-on-secondary-container"
    >
      <p className="flex-1">{steps(platform)}</p>
      {platform === 'chromium' && (
        <button
          type="button"
          onClick={() => void promptInstall().then((ok) => ok && close())}
          className="min-h-12 rounded bg-primary px-4 font-medium text-on-primary"
        >
          {s.action}
        </button>
      )}
      <button
        type="button"
        aria-label={s.close}
        onClick={close}
        className="min-h-12 min-w-12 rounded border border-outline px-3"
      >
        ✕
      </button>
    </div>
  )
}
