import { formatBRL, parsePriceBRL } from '@/domain/price'
import { strings } from '@/strings/pt-BR'
import { TextField } from './TextField'

interface Props {
  label: string
  value: string
  onChange: (text: string) => void
  onBlur?: () => void
  /** Message shown when the text is not a valid price. */
  invalidMessage: string
  helper?: string
}

/** "12,90" without the currency symbol, via domain/price. */
function plain(cents: number): string {
  return formatBRL(cents)
    .replace(/^R\$\s*/, '')
    .trim()
}

/** Optional BRL field: "R$" prefix, formats on blur. Parsing stays in domain/price. */
export function MoneyField({ label, value, onChange, onBlur, invalidMessage, helper }: Props) {
  const parsed = parsePriceBRL(value)
  return (
    <TextField
      label={label}
      helper={helper}
      type="text"
      inputMode="decimal"
      prefix={strings.item.currencyPrefix}
      value={value}
      error={parsed.ok ? undefined : invalidMessage}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => {
        if (parsed.ok && parsed.cents !== null) {
          const text = plain(parsed.cents)
          if (text !== value) onChange(text)
        }
        onBlur?.()
      }}
    />
  )
}
