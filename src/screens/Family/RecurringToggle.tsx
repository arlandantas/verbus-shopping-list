import { Switch } from '@/components/m3/Switch'
import { strings } from '@/strings/pt-BR'
import { GroupRow } from './GroupRow'

interface Props {
  checked: boolean
  onChange: (value: boolean) => void
  disabled?: boolean
  /** Render as a Grupo-screen card row instead of a plain switch. */
  asRow?: boolean
}

/** "Usar a Despensa" switch with its explanation (ADR-0028); shared by create form and Grupo screen. */
export function RecurringToggle({ checked, onChange, disabled, asRow }: Props) {
  const t = strings.family.recurring
  if (asRow) {
    return (
      <GroupRow
        icon="kitchen"
        title={t.label}
        supporting={t.explain}
        asLabel
        trailing={
          <Switch
            label=""
            aria-label={t.label}
            checked={checked}
            disabled={disabled}
            onChange={(e) => onChange(e.target.checked)}
          />
        }
      />
    )
  }
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
