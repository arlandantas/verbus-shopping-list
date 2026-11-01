import { useState, type FormEvent } from 'react'
import type { PurchaseLine } from '@/data/converters'
import type { PurchaseLinePatch } from '@/data/history'
import { BottomSheet } from '@/components/m3/BottomSheet'
import { Button } from '@/components/m3/Button'
import { MoneyField } from '@/components/m3/MoneyField'
import { Select } from '@/components/m3/Select'
import { TextField } from '@/components/m3/TextField'
import { parseQuantity } from '@/components/ItemForm'
import { formatBRL, parsePriceBRL } from '@/domain/price'
import { UNITS, type Unit } from '@/domain/units'
import { strings } from '@/strings/pt-BR'
import { formatPurchaseDay } from './PurchaseCards'

interface Props {
  line: PurchaseLine
  purchase?: { market: string | null; purchasedAt: Date }
  onSave: (patch: PurchaseLinePatch) => void
  onClose: () => void
}

const unitLabel = (u: Unit) => (u === 'l' ? 'L' : u)

/** "Editar item comprado" sheet (ADR-0021): quantity, unit and price only. Mount while editing. */
export function EditLineSheet({ line, purchase, onSave, onClose }: Props) {
  const [quantity, setQuantity] = useState(String(line.quantity).replace('.', ','))
  const [unit, setUnit] = useState<Unit>(line.unit)
  const [price, setPrice] = useState(
    line.priceCents == null ? '' : formatBRL(line.priceCents).replace(/^R\$\s*/, ''),
  )
  const qty = parseQuantity(quantity)
  const parsed = parsePriceBRL(price)
  const valid = qty !== null && parsed.ok

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (qty === null || !parsed.ok) return
    const patch: PurchaseLinePatch = {}
    if (qty !== line.quantity) patch.quantity = qty
    if (unit !== line.unit) patch.unit = unit
    if (parsed.cents !== (line.priceCents ?? null)) patch.priceCents = parsed.cents
    if (Object.keys(patch).length > 0) onSave(patch)
    onClose()
  }

  return (
    <BottomSheet open title={strings.history.editTitle} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
        <TextField label={strings.item.name} value={line.name} readOnly />
        {purchase && (
          <TextField
            label={strings.history.purchaseInfo}
            value={`${formatPurchaseDay(purchase.purchasedAt)} · ${purchase.market ?? strings.history.noMarket}`}
            readOnly
          />
        )}
        <TextField
          label={strings.item.quantity}
          inputMode="decimal"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={qty === null ? strings.item.quantityInvalid : undefined}
        />
        <Select
          label={strings.item.unit}
          value={unit}
          onChange={(e) => setUnit(e.target.value as Unit)}
        >
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {unitLabel(u)}
            </option>
          ))}
        </Select>
        <MoneyField
          label={strings.item.price}
          value={price}
          onChange={setPrice}
          invalidMessage={strings.item.priceInvalid}
        />
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="text" onClick={onClose}>
            {strings.item.cancel}
          </Button>
          <Button type="submit" disabled={!valid}>
            {strings.item.save}
          </Button>
        </div>
      </form>
    </BottomSheet>
  )
}
