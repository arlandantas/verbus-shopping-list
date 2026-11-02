import { Switch } from '@/components/m3/Switch'
import { strings } from '@/strings/pt-BR'

interface Props {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
}

/** "Despensa e compras recorrentes" switch with its explanation (ADR-0028); shared by create form and Grupo screen. */
export function RecurringToggle({ checked, onChange, disabled }: Props) {
  const t = strings.family.recurring
  return (
    <div className="flex flex-col gap-1">
      <Switch
        label={t.label}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <p className="m-0 text-sm text-on-surface-variant">{t.explain}</p>
    </div>
  )
}
