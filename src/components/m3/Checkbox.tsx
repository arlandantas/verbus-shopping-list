import type { InputHTMLAttributes } from 'react'
import { Icon } from './Icon'
import './fields.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type' | 'role'> & {
  label: string
}

/** Native checkbox, 48px touch area, check icon mark. */
export function Checkbox({ label, ...rest }: Props) {
  return (
    <label className="m3-check">
      <span className="m3-check__area">
        <input type="checkbox" className="m3-check__input" {...rest} />
        <span className="m3-check__box" aria-hidden="true">
          <Icon name="check" size={18} />
        </span>
      </span>
      {label}
    </label>
  )
}
