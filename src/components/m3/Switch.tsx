import type { InputHTMLAttributes } from 'react'
import './fields.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type' | 'role'> & {
  label: string
}

export function Switch({ label, checked, ...rest }: Props) {
  return (
    <label className="m3-switch">
      {label}
      <input
        type="checkbox"
        role="switch"
        aria-checked={Boolean(checked)}
        checked={checked}
        className="m3-switch__input"
        {...rest}
      />
      <span className="m3-switch__track" aria-hidden="true">
        <span className="m3-switch__thumb" />
      </span>
    </label>
  )
}
