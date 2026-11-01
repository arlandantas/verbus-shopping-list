import type { ButtonHTMLAttributes } from 'react'
import './chips.css'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  children: string
}

/** M3 suggestion/assist chip: 32px visual, 48px touch area. */
export function Chip({ children, type = 'button', ...rest }: Props) {
  return (
    <button type={type} className="m3-chip" {...rest}>
      {children}
    </button>
  )
}
