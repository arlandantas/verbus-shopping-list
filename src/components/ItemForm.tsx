import { useState, type FormEvent } from 'react'
import { useFamily } from '@/app/FamilyProvider'
import type { Category, Item } from '@/data/converters'
import type { ItemPatch } from '@/data/items'
import { Button } from '@/components/m3/Button'
import { Checkbox } from '@/components/m3/Checkbox'
import { MoneyField } from '@/components/m3/MoneyField'
import { Select } from '@/components/m3/Select'
import { TextField } from '@/components/m3/TextField'
import { formatBRL, parsePriceBRL } from '@/domain/price'
import { UNITS, type Unit } from '@/domain/units'
import { strings } from '@/strings/pt-BR'

const MAX_NOTE = 120

/** Accepts "1,5" or "1.5"; returns null unless the value is in (0, 9999]. */
export function parseQuantity(text: string): number | null {
  const t = text.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(t)) return null
  const n = Number(t)
  return n > 0 && n <= 9999 ? n : null
}

const unitLabel = (u: Unit) => (u === 'l' ? 'L' : u)

interface Props {
  item: Item
  categories: readonly Category[]
  /** Called with only the changed fields (possibly empty). */
  onSave: (patch: ItemPatch) => void
  onCancel: () => void
  /** Asks to delete; the confirmation lives in the parent. */
  onDelete: () => void
}

/** Fields + footer of the "Editar item" sheet. Price and cart status are independent (ADR-0022). */
export function ItemForm({ item, categories, onSave, onCancel, onDelete }: Props) {
  const { family } = useFamily()
  const [name, setName] = useState(item.name)
  const [quantity, setQuantity] = useState(String(item.quantity).replace('.', ','))
  const [unit, setUnit] = useState<Unit>(item.unit)
  const known = categories.some((c) => c.id === item.categoryId)
  const initialCategory = known ? (item.categoryId ?? '') : ''
  const [categoryId, setCategoryId] = useState(initialCategory)
  const [note, setNote] = useState(item.note ?? '')
  const [recurring, setRecurring] = useState(item.recurring)
  const bought = item.status === 'bought'
  const [inCart, setInCart] = useState(bought)
  const [price, setPrice] = useState(
    item.priceCents == null ? '' : formatBRL(item.priceCents).replace(/^R\$\s*/, ''),
  )
  const parsed = parseQuantity(quantity)
  const parsedPrice = parsePriceBRL(price)
  const nameEmpty = name.trim() === ''
  const valid = parsed !== null && !nameEmpty && parsedPrice.ok

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (parsed === null || !valid || !parsedPrice.ok) return
    const patch: ItemPatch = {}
    if (name.trim() !== item.name) patch.name = name.trim()
    if (parsed !== item.quantity) patch.quantity = parsed
    if (unit !== item.unit) patch.unit = unit
    if (categoryId !== initialCategory) patch.categoryId = categoryId === '' ? null : categoryId
    const newNote = note.trim() === '' ? null : note.trim()
    if (newNote !== item.note) patch.note = newNote
    if (recurring !== item.recurring) patch.recurring = recurring
    if (parsedPrice.cents !== item.priceCents) patch.priceCents = parsedPrice.cents
    if (inCart !== bought) patch.status = inCart ? 'bought' : 'pending'
    onSave(patch)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 pt-2">
      <TextField
        label={strings.item.name}
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={nameEmpty ? strings.item.nameEmpty : undefined}
      />
      <div className="grid grid-cols-2 gap-4 [&>*]:min-w-0">
        <TextField
          label={strings.item.quantity}
          inputMode="decimal"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          error={parsed === null ? strings.item.quantityInvalid : undefined}
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
      </div>
      {categories.length === 0 ? (
        <p className="m-0 text-sm text-on-surface-variant">{strings.categories.noneForItem}</p>
      ) : (
        <Select
          label={strings.item.category}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">{strings.noCategory}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      )}
      <TextField
        label={strings.item.note}
        value={note}
        maxLength={MAX_NOTE}
        counter
        onChange={(e) => setNote(e.target.value)}
      />
      {family?.recurringEnabled !== false && (
        <Checkbox
          label={strings.item.recurring}
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
        />
      )}
      <Checkbox
        label={strings.item.inCart}
        checked={inCart}
        onChange={(e) => setInCart(e.target.checked)}
      />
      <MoneyField label={strings.item.price} value={price} onChange={setPrice} />
      <div className="flex items-center gap-2 pt-2">
        <Button
          variant="text"
          onClick={onDelete}
          style={{ color: 'var(--md-sys-color-error)', marginRight: 'auto' }}
        >
          {strings.item.delete}
        </Button>
        <Button variant="text" onClick={onCancel}>
          {strings.item.cancel}
        </Button>
        <Button type="submit" disabled={!valid}>
          {strings.item.save}
        </Button>
      </div>
    </form>
  )
}
