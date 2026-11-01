import { MAX_PRICE_CENTS, formatBRL } from '@/domain/price'
import { strings } from '@/strings/pt-BR'
import { TextField } from './TextField'

interface Props {
  label: string
  value: string
  onChange: (text: string) => void
  onBlur?: () => void
  helper?: string
}

/** "12,90" without the currency symbol, via domain/price. */
function plain(cents: number): string {
  return formatBRL(cents)
    .replace(/^R\$\s*/, '')
    .trim()
}

/** Keeps only digits (capped at the price ceiling) and formats them as cents: "1290" -> "12,90". */
function mask(raw: string): string {
  let digits = raw.replace(/\D/g, '').replace(/^0+/, '')
  while (Number(digits) > MAX_PRICE_CENTS) digits = digits.slice(0, -1)
  return digits === '' ? '' : plain(Number(digits))
}

/** Optional BRL field: "R$" prefix, cents mask while typing. Parsing stays in domain/price. */
export function MoneyField({ label, value, onChange, onBlur, helper }: Props) {
  return (
    <TextField
      label={label}
      helper={helper}
      type="text"
      inputMode="numeric"
      prefix={strings.item.currencyPrefix}
      value={value}
      onChange={(e) => onChange(mask(e.target.value))}
      onBlur={onBlur}
    />
  )
}
