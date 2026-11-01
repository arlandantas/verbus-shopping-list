import type { InputHTMLAttributes } from 'react'
import { Icon } from './Icon'
import './fields.css'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'type' | 'role'> & {
  label: string
  /** Visually label-less: the name goes to aria-label (e.g. a list row checkbox). */
  hideLabel?: boolean
}

/** Native checkbox, 48px touch area, check icon mark. */
export function Checkbox({ label, hideLabel, ...rest }: Props) {
  return (
    <label className="m3-check">
      <span className="m3-check__area">
        <input
          type="checkbox"
          className="m3-check__input"
          aria-label={hideLabel ? label : undefined}
          {...rest}
        />
        <span className="m3-check__box" aria-hidden="true">
          <Icon name="check" size={18} />
        </span>
      </span>
      {!hideLabel && label}
    </label>
  )
}
