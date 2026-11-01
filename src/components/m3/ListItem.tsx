import type { ReactNode } from 'react'
import './m3.css'

type Props = {
  leading?: ReactNode
  headline: string
  supporting?: ReactNode
  trailing?: ReactNode
  struck?: boolean
  onClick?: () => void
}

/** M3 list item (>=56px): leading control, headline + supporting text, trailing actions. */
export function ListItem({ leading, headline, supporting, trailing, struck, onClick }: Props) {
  return (
    <li className={`m3-list-item${struck ? ' m3-list-item--struck' : ''}`} onClick={onClick}>
      {leading}
      <div className="m3-list-item__text">
        <span className="m3-list-item__headline">{headline}</span>
        {supporting && <span className="m3-list-item__supporting">{supporting}</span>}
      </div>
      {trailing && <div className="m3-list-item__trailing">{trailing}</div>}
    </li>
  )
}
