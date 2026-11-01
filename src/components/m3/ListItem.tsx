import type { ReactNode } from 'react'
import './m3.css'

type Props = {
  leading?: ReactNode
  headline: string
  supporting?: ReactNode
  trailing?: ReactNode
  struck?: boolean
  tone?: 'primary' | 'muted'
  onClick?: () => void
  /** Overrides the accessible name of the row. */
  label?: string
}

/** M3 list item (>=56px): leading control, headline + supporting text, trailing actions. */
export function ListItem({
  leading,
  headline,
  supporting,
  trailing,
  struck,
  tone,
  onClick,
  label,
}: Props) {
  return (
    <li
      className={`m3-list-item${struck ? ' m3-list-item--struck' : ''}${tone ? ` m3-list-item--${tone}` : ''}`}
      onClick={onClick}
      aria-label={label}
    >
      {leading}
      <div className="m3-list-item__text">
        <span className="m3-list-item__headline">{headline}</span>
        {supporting && <span className="m3-list-item__supporting">{supporting}</span>}
      </div>
      {trailing && <div className="m3-list-item__trailing">{trailing}</div>}
    </li>
  )
}
