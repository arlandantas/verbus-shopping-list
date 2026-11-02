import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { strings } from '@/strings/pt-BR'
import { IconButton } from './IconButton'
import './overlay.css'

const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'
const FIELDS = 'input:not([disabled]),select:not([disabled]),textarea:not([disabled])'

let overlaySeq = 0
let scrollLocks = 0
let savedOverflow = ''
function lockScroll() {
  if (scrollLocks++ === 0) {
    savedOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
  }
}
function unlockScroll() {
  if (--scrollLocks === 0) document.body.style.overflow = savedOverflow
}
/** Open overlays, bottom first. Each owns one history entry, so depth in history = stack order. */
const stack: { token: number; close: () => void; pending: boolean }[] = []

/** Drops `token` and every overlay above it; returns how many history entries to unwind. */
function release(token: number): { count: number; above: (() => void)[] } {
  const at = stack.findIndex((o) => o.token === token)
  if (at < 0) return { count: 0, above: [] }
  const dropped = stack.splice(at)
  return { count: dropped.length, above: dropped.slice(1).map((o) => o.close) }
}

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
  const tokenRef = useRef(0)
  useEffect(() => {
    closeRef.current = onClose
  })

  useEffect(() => {
    if (!open) return
    const opener = document.activeElement as HTMLElement | null
    const panel = panelRef.current
    const first =
      panel?.querySelector<HTMLElement>(FIELDS) ?? panel?.querySelector<HTMLElement>(FOCUSABLE)
    ;(first ?? panel)?.focus()

    lockScroll()

    // A cleanup only marks the entry pending; the history unwind runs in a microtask and is
    // skipped when the same component re-registers first (StrictMode's simulated remount).
    const revived = stack.find((o) => o.token === tokenRef.current && o.pending)
    let token = tokenRef.current
    if (revived) {
      revived.pending = false
      revived.close = () => closeRef.current()
    } else {
      token = tokenRef.current = ++overlaySeq
      stack.push({ token, close: () => closeRef.current(), pending: false })
      history.pushState({ m3overlay: token }, '')
    }
    const onPop = (e: PopStateEvent) => {
      // The entry we landed on tells how deep we are: overlays above it were popped by navigation.
      // Landing on an overlay entry that is no longer open is the echo of our own unwind: ignore.
      const landed = (e.state as { m3overlay?: number } | null)?.m3overlay ?? 0
      if (landed !== 0 && !stack.some((o) => o.token === landed)) return
      if (token <= landed) return
      const { count, above } = release(token)
      if (count === 0) return
      closeRef.current()
      above.forEach((close) => close())
    }
    window.addEventListener('popstate', onPop)

    return () => {
      window.removeEventListener('popstate', onPop)
      const entry = stack.find((o) => o.token === token)
      if (entry) {
        entry.pending = true
        queueMicrotask(() => {
          if (!entry.pending) return
          const { count, above } = release(token)
          if (count === 1) history.back()
          else if (count > 1) history.go(-count)
          above.forEach((close) => close())
        })
      }
      unlockScroll()
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
        tabIndex={-1}
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
