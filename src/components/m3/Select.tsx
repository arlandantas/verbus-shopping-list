import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'
import './fields.css'

type Props = Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> & {
  label: string
  children: ReactNode
}

/** Native select styled as an M3 outlined field. */
export function Select({ label, id, children, ...rest }: Props) {
  const auto = useId()
  const selectId = id ?? auto
  return (
    <div className="m3-field">
      <label htmlFor={selectId} className="m3-field__label">
        {label}
      </label>
      <div className="m3-field__box">
        <select id={selectId} className="m3-field__input" {...rest}>
          {children}
        </select>
      </div>
    </div>
  )
}
