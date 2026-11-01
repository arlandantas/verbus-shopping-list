import { useState } from 'react'
import { dismissHint, shouldShowIosInstallHint } from '@/pwa/installHint'
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

/** In-flow card teaching iPhone/iPad Safari users to install the app; dismissal is remembered. */
export function IosInstallHint() {
  const [show, setShow] = useState(() => shouldShowIosInstallHint(window))
  if (!show) return null
  const s = strings.iosInstall
  return (
    <div
      role="note"
      className="mx-4 my-2 flex items-center gap-2 rounded border border-outline bg-secondary-container px-3 py-2 text-sm text-on-secondary-container"
    >
      <p className="flex-1">
        {s.before} <strong>{s.share}</strong> <ShareIcon /> {s.then} <strong>{s.add}</strong>.
      </p>
      <button
        type="button"
        aria-label={s.close}
        onClick={() => {
          dismissHint()
          setShow(false)
        }}
        className="min-h-12 min-w-12 rounded border border-outline px-3"
      >
        ✕
      </button>
    </div>
  )
}
