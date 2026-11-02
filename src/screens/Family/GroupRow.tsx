import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Icon, type IconName } from '@/components/m3/Icon'

type Props = {
  icon: IconName
  title: string
  supporting?: string
  /** Right-side affordance (chevron, switch...). */
  trailing: ReactNode
  /** Renders the row as a link. */
  to?: string
  /** Renders the row as a button (with aria-expanded when `expanded` is set). */
  onClick?: () => void
  expanded?: boolean
  /** Renders the row as a label wrapping a control passed in `trailing`. */
  asLabel?: boolean
}

/** Shared card row of the Grupo screen: leading icon, title (+ supporting), trailing affordance. */
export function GroupRow({
  icon,
  title,
  supporting,
  trailing,
  to,
  onClick,
  expanded,
  asLabel,
}: Props) {
  const inner = (
    <>
      <Icon name={icon} />
      <span className="group-row__text">
        <span className="group-row__title">{title}</span>
        {supporting && <span className="group-row__supporting">{supporting}</span>}
      </span>
      <span className="group-row__trailing">{trailing}</span>
    </>
  )
  const cls = 'group-row__body'
  let body: ReactNode
  if (to) {
    body = (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    )
  } else if (asLabel) {
    body = <label className={cls}>{inner}</label>
  } else {
    body = (
      <button type="button" className={cls} onClick={onClick} aria-expanded={expanded}>
        {inner}
      </button>
    )
  }
  return <div className="group-row">{body}</div>
}
