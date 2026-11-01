import { useEffect, useRef, useState } from 'react'
import type { Category } from '@/data/converters'
import type { PasteRow } from '@/domain/pasteList'
import { formatQuantity } from '@/domain/itemText'
import { strings } from '@/strings/pt-BR'
import { BottomSheet } from '@/components/m3/BottomSheet'
import { Button } from '@/components/m3/Button'
import { Checkbox } from '@/components/m3/Checkbox'

interface Props {
  rows: readonly PasteRow[]
  truncated: boolean
  categories: readonly Category[]
  onConfirm: (rows: PasteRow[]) => void
  onClose: () => void
}

/** Preview of a pasted list (ADR-0027). Mount it only while open. */
export function PasteListSheet({ rows, truncated, categories, onConfirm, onClose }: Props) {
  const [marked, setMarked] = useState(
    () => new Set(rows.filter((r) => r.selected).map((r) => r.nameKey)),
  )
  const confirmRef = useRef<HTMLDivElement>(null)
  // Runs after the Overlay's own effect, which would focus the first checkbox.
  useEffect(() => {
    confirmRef.current?.querySelector('button')?.focus()
  }, [])

  const chosen = rows.filter((r) => marked.has(r.nameKey))
  const toggle = (key: string) =>
    setMarked((prev) => {
      const next = new Set(prev)
      if (!next.delete(key)) next.add(key)
      return next
    })
  const categoryName = (id: string | null) => categories.find((c) => c.id === id)?.name

  return (
    <BottomSheet
      open
      title={strings.list.paste.title}
      onClose={onClose}
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            {strings.overlay.cancel}
          </Button>
          <div ref={confirmRef}>
            <Button disabled={chosen.length === 0} onClick={() => onConfirm(chosen)}>
              {strings.list.paste.confirm(chosen.length)}
            </Button>
          </div>
        </>
      }
    >
      {truncated && <p className="m-0 pb-2 text-sm text-error">{strings.list.paste.truncated}</p>}
      <ul className="m-0 flex list-none flex-col p-0">
        {rows.map((r) => {
          const category = categoryName(r.categoryId)
          return (
            <li key={r.nameKey}>
              <Checkbox
                label={r.name}
                checked={marked.has(r.nameKey)}
                onChange={() => toggle(r.nameKey)}
              />
              <p className="m-0 pb-2 pl-12 text-sm text-on-surface-variant">
                <span>
                  {[formatQuantity(r.quantity, r.unit), category].filter(Boolean).join(' · ')}
                </span>
                {r.duplicate && <span> · {strings.list.paste.duplicate}</span>}
              </p>
            </li>
          )
        })}
      </ul>
    </BottomSheet>
  )
}
