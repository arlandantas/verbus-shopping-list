import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { strings } from '@/strings/pt-BR'
import { IconButton } from './IconButton'
import './overlay.css'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
const FIELDS = 'input:not([disabled]),select:not([disabled]),textarea:not([disabled])'

export type OverlayProps = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  actions?: ReactNode
}

type Props = OverlayProps & { kind: 'sheet' | 'dialog' }

/** Modal core shared by BottomSheet and Dialog: portal + manual focus (jsdom lacks showModal). */
export function Overlay({ open, title, onClose, children, actions, kind }: Props) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const first =
      panel?.querySelector<HTMLElement>(FIELDS) ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    let popped = false
    history.pushState({ m3overlay: true }, '')
    const onPop = () => {
      popped = true
      closeRef.current()
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      if (!popped) history.back()
      document.body.style.overflow = prevOverflow
      opener?.focus?.()
    }
  }, [open])

  if (!open) return null

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation()
      onClose()
      return
    }
    if (e.key !== 'Tab' || !panelRef.current) return
    const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)]
    if (items.length === 0) return
    const firstEl = items[0]
    const lastEl = items[items.length - 1]
    const active = document.activeElement
    if (e.shiftKey && (active === firstEl || !panelRef.current.contains(active))) {
      e.preventDefault()
      lastEl.focus()
    } else if (!e.shiftKey && (active === lastEl || !panelRef.current.contains(active))) {
      e.preventDefault()
      firstEl.focus()
    }
  }

  return createPortal(
    <div className={`m3-overlay m3-overlay--${kind}`} onKeyDown={onKeyDown}>
      <div className="m3-scrim" data-testid="scrim" onClick={onClose} />
      <div
        ref={panelRef}
        className="m3-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        {kind === 'sheet' && <div className="m3-overlay__handle" aria-hidden="true" />}
        <header className="m3-overlay__header">
          <h2 id={titleId} className="m3-overlay__title">
            {title}
          </h2>
          {kind === 'sheet' && (
            <IconButton icon="close" label={strings.overlay.close} onClick={onClose} />
          )}
        </header>
        <div className="m3-overlay__body">{children}</div>
        {actions && <div className="m3-overlay__actions">{actions}</div>}
      </div>
    </div>,
    document.body,
  )
}
