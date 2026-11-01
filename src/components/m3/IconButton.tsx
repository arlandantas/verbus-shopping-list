import type { ButtonHTMLAttributes } from 'react'
import { Icon, type IconName } from './Icon'
import './m3.css'

export type IconButtonVariant = 'standard' | 'filled' | 'tonal'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'aria-label'> & {
  icon: IconName
  label: string
  variant?: IconButtonVariant
  selected?: boolean
}

export function IconButton({
  icon,
  label,
  variant = 'standard',
  selected,
  type = 'button',
  ...rest
}: Props) {
  return (
    <button
      type={type}
      className={`m3-icon-btn m3-icon-btn--${variant}`}
      aria-label={label}
      aria-pressed={selected}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  )
}
