import { parsePriceBRL } from '@/domain/price'
import { strings } from '@/strings/pt-BR'

interface Props {
  value: string
  onChange: (text: string) => void
  onBlur?: () => void
  /** Accessible label; defaults to the generic price label. */
  label?: string
}

/** Optional BRL price field (comma decimals). Parsing stays in domain/price. */
export function PriceInput({ value, onChange, onBlur, label }: Props) {
  const invalid = !parsePriceBRL(value).ok
  return (
    <>
      <label className="flex flex-col gap-1">
        {label ?? strings.item.price}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={invalid}
          className="min-h-12 w-full rounded border border-gray-400 px-3 text-base"
        />
      </label>
      {invalid && (
        <span role="alert" className="text-sm text-red-800">
          {strings.item.priceInvalid}
        </span>
      )}
    </>
  )
}
