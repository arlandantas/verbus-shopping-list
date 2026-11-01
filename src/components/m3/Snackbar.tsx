import { useEffect, useRef } from 'react'
import './overlay.css'

type Props = {
  message: string
  actionLabel?: string
  onAction?: () => void
  onDismiss: () => void
  duration?: number
}

/** Render with a changing `key` to replace the current snackbar and restart the timer. */
export function Snackbar({ message, actionLabel, onAction, onDismiss, duration = 4000 }: Props) {
  const dismissRef = useRef(onDismiss)
  useEffect(() => {
    dismissRef.current = onDismiss
  })

  useEffect(() => {
    const t = setTimeout(() => dismissRef.current(), duration)
    return () => clearTimeout(t)
  }, [message, duration])

  return (
    <div className="m3-snackbar-region" role="status" aria-live="polite">
      <div className="m3-snackbar" key={message}>
        <span className="m3-snackbar__text">{message}</span>
        {actionLabel && (
          <button
            type="button"
            className="m3-snackbar__action"
            onClick={() => {
              onAction?.()
              onDismiss()
            }}
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}
