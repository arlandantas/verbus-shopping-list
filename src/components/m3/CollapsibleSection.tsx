import { useId, type ReactNode } from 'react'
import { Icon } from './Icon'
import './collapsible.css'

/** M3 expandable list section: tonal rounded header (title, count, chevron in a circle); children sit in tonal rounded rows. */
export function CollapsibleSection({
  title,
  count,
  open,
  onToggle,
  done,
  listLabel,
  footer,
  children,
}: {
  title: string
  count: string
  open: boolean
  onToggle: () => void
  /** Shows a check icon before the count. */
  done?: boolean
  /** Accessible name of the inner list (omit when the caller renders its own). */
  listLabel?: string
  /** Rendered below the list while open. */
  footer?: ReactNode
  children: ReactNode
}) {
  const listId = useId()
  return (
    <section aria-label={title} className="m3-section">
      <h2 className="m3-section__heading">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={listId}
          onClick={onToggle}
          className="m3-section__header"
        >
          <span className="m3-section__title">{title}</span>
          {done && <Icon name="check" />}
          <span className="m3-section__count">{count}</span>
          <span className="m3-section__chevron">
            <Icon name={open ? 'expand_less' : 'expand_more'} />
          </span>
        </button>
      </h2>
      {open && (
        <ul id={listId} className="m3-section__list" aria-label={listLabel}>
          {children}
        </ul>
      )}
      {open && footer}
    </section>
  )
}
