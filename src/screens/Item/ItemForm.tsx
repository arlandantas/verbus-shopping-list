import { useState, type FormEvent } from 'react'
import type { Category, Item } from '@/data/converters'
import type { ItemPatch } from '@/data/items'
import { UNITS, type Unit } from '@/domain/units'
import { strings } from '@/strings/pt-BR'

const MAX_NOTE = 120
const input = 'min-h-12 w-full rounded border border-gray-400 px-3 text-base'

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
  onSave: (patch: ItemPatch) => void
  onDelete: () => void
}

export function ItemForm({ item, categories, onSave, onDelete }: Props) {
  const [quantity, setQuantity] = useState(String(item.quantity).replace('.', ','))
  const [unit, setUnit] = useState<Unit>(item.unit)
  const known = categories.some((c) => c.id === item.categoryId)
  const initialCategory = known ? (item.categoryId ?? '') : ''
  const [categoryId, setCategoryId] = useState(initialCategory)
  const [note, setNote] = useState(item.note ?? '')
  const [recurring, setRecurring] = useState(item.recurring)
  const [confirming, setConfirming] = useState(false)
  const parsed = parseQuantity(quantity)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (parsed === null) return
    const patch: ItemPatch = {}
    if (parsed !== item.quantity) patch.quantity = parsed
    if (unit !== item.unit) patch.unit = unit
    if (categoryId !== initialCategory) patch.categoryId = categoryId === '' ? null : categoryId
    const newNote = note.trim() === '' ? null : note.trim()
    if (newNote !== item.note) patch.note = newNote
    if (recurring !== item.recurring) patch.recurring = recurring
    onSave(patch)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 p-4">
      <label className="flex flex-col gap-1">
        {strings.item.quantity}
        <input
          type="text"
          inputMode="decimal"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          aria-invalid={parsed === null}
          className={input}
        />
      </label>
      {parsed === null && (
        <span role="alert" className="text-sm text-red-800">
          {strings.item.quantityInvalid}
        </span>
      )}
      <label className="flex flex-col gap-1">
        {strings.item.unit}
        <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)} className={input}>
          {UNITS.map((u) => (
            <option key={u} value={u}>
              {unitLabel(u)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        {strings.item.category}
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={input}
        >
          <option value="">{strings.noCategory}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1">
        {strings.item.note}
        <input
          type="text"
          value={note}
          maxLength={MAX_NOTE}
          onChange={(e) => setNote(e.target.value)}
          className={input}
        />
      </label>
      <label className="flex min-h-12 items-center gap-3">
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
          className="h-6 w-6 accent-green-700"
        />
        {strings.item.recurring}
      </label>
      <button
        type="submit"
        disabled={parsed === null}
        className="min-h-12 w-full rounded bg-green-700 px-4 text-base font-medium text-white disabled:opacity-50"
      >
        {strings.item.save}
      </button>
      {confirming ? (
        <div className="flex flex-col gap-2" role="group" aria-label={strings.item.delete}>
          <p>{strings.item.confirmDelete(item.name)}</p>
          <button
            type="button"
            onClick={onDelete}
            className="min-h-12 rounded bg-red-800 px-4 text-base font-medium text-white"
          >
            {strings.item.confirm}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="min-h-12 rounded border border-gray-400 px-4 text-base"
          >
            {strings.item.cancel}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="min-h-12 w-full rounded border border-red-800 px-4 text-base text-red-800"
        >
          {strings.item.delete}
        </button>
      )}
    </form>
  )
}
