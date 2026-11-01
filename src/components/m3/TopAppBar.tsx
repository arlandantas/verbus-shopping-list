import type { ReactNode } from 'react'
import { Icon } from './Icon'
import './m3.css'

type Props = {
  title: string
  subtitle?: string
  navigation?: ReactNode
  actions?: ReactNode
  /** Makes the title a switcher trigger: tapping the titles or the chevron calls this. */
  onTitleClick?: () => void
  /** Accessible name of the chevron button (required with onTitleClick). */
  titleLabel?: string
}

export function TopAppBar({
  title,
  subtitle,
  navigation,
  actions,
  onTitleClick,
  titleLabel,
}: Props) {
  return (
    <header className="m3-top-bar">
      {navigation}
      <div
        className={`m3-top-bar__titles${onTitleClick ? ' m3-top-bar__titles--tap' : ''}`}
        onClick={onTitleClick}
      >
        <h1 className="m3-top-bar__title">{title}</h1>
        {subtitle && (
          <p className="m3-top-bar__subtitle" aria-live="polite">
            {subtitle}
          </p>
        )}
      </div>
      {onTitleClick && (
        <button
          type="button"
          className="m3-top-bar__switch"
          aria-label={titleLabel}
          aria-haspopup="dialog"
          onClick={onTitleClick}
        >
          <Icon name="expand_more" />
        </button>
      )}
      {actions && <div className="m3-top-bar__actions">{actions}</div>}
    </header>
  )
}
