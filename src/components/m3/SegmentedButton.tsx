import { useRef, type KeyboardEvent } from 'react'
import './segmented.css'

interface Props<T extends string> {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

/** M3 single-select segmented button (radiogroup), 48px touch height. */
export function SegmentedButton<T extends string>({ label, options, value, onChange }: Props<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const step =
      e.key === 'ArrowRight' || e.key === 'ArrowDown'
        ? 1
        : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
          ? -1
          : 0
    if (!step) return
    e.preventDefault()
    const next = (i + step + options.length) % options.length
    refs.current[next]?.focus()
    onChange(options[next]!.value)
  }
  return (
    <div role="radiogroup" aria-label={label} className="m3-segmented">
      {options.map((o, i) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={o.value === value ? 0 : -1}
          onKeyDown={(e) => onKey(e, i)}
          ref={(el) => {
            refs.current[i] = el
          }}
          className="m3-segmented__option"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
