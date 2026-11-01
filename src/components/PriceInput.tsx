import { parsePriceBRL } from '@/domain/price'
import { strings } from '@/strings/pt-BR'

interface Props {
  value: string
  onChange: (text: string) => void
}

/** Optional BRL price field (comma decimals). Parsing stays in domain/price. */
export function PriceInput({ value, onChange }: Props) {
  const invalid = !parsePriceBRL(value).ok
  return (
    <>
      <label className="flex flex-col gap-1">
        {strings.item.price}
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
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
