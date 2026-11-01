import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Icon, type IconName } from './Icon'
import './m3.css'

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'text'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
  variant?: ButtonVariant
  icon?: IconName
  children: ReactNode
}

export function Button({ variant = 'filled', icon, children, type = 'button', ...rest }: Props) {
  const cls = `m3-btn m3-btn--${variant}${icon ? ' m3-btn--has-icon' : ''}`
  return (
    <button type={type} className={cls} {...rest}>
      {icon && <Icon name={icon} size={18} />}
      {children}
    </button>
  )
}
