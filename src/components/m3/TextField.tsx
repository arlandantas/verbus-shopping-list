import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import './fields.css'

export type TextFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'className' | 'aria-invalid' | 'aria-describedby'
> & {
  label: string
  helper?: string
  /** Error message; when set the field is invalid and the message is announced. */
  error?: string
  /** Visible leading text inside the field (e.g. currency). */
  prefix?: ReactNode
  /** Shows "length/maxLength" when maxLength is set. */
  counter?: boolean
}

export function TextField({
  label,
  helper,
  error,
  prefix,
  counter,
  id,
  value,
  maxLength,
  ...rest
}: TextFieldProps) {
  const auto = useId()
  const inputId = id ?? auto
  const msgId = `${inputId}-msg`
  const hasMsg = Boolean(error || helper)
  const showCounter = counter && maxLength !== undefined
  return (
    <div className={`m3-field${error ? ' m3-field--error' : ''}`}>
      <label htmlFor={inputId} className="m3-field__label">
        {label}
      </label>
      <div className="m3-field__box">
        {prefix !== undefined && <span className="m3-field__prefix">{prefix}</span>}
        <input
          id={inputId}
          className="m3-field__input"
          value={value}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          aria-describedby={hasMsg ? msgId : undefined}
          {...rest}
        />
      </div>
      <div className="m3-field__support">
        {hasMsg && (
          <span id={msgId} role={error ? 'alert' : undefined}>
            {error ?? helper}
          </span>
        )}
        {showCounter && (
          <span className="m3-field__counter">
            {String(value ?? '').length}/{maxLength}
          </span>
        )}
      </div>
    </div>
  )
}
