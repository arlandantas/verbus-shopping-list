import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { CatalogEntry } from '@/data/converters'
import { parseItemText, type ParsedItem } from '@/domain/itemText'
import { suggest } from '@/domain/suggest'
import { strings } from '@/strings/pt-BR'
import { Suggestions } from './Suggestions'

const NO_KEYS: ReadonlySet<string> = new Set()

interface Props {
  onAdd: (text: string) => void
  catalog?: CatalogEntry[]
  pendingKeys?: ReadonlySet<string>
  /** `typed` is set only when the text carried its own quantity/unit (it wins over the catalog). */
  onPick?: (entry: CatalogEntry, typed: ParsedItem | null) => void
}

export function AddItemBar({ onAdd, catalog = [], pendingKeys = NO_KEYS, onPick }: Props) {
  const [text, setText] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const blank = text.trim() === ''

  const parsed = useMemo(() => parseItemText(text), [text])
  const suggestions = useMemo(
    () => (dismissed || !parsed ? [] : suggest(catalog, parsed.name, pendingKeys)),
    [dismissed, parsed, catalog, pendingKeys],
  )

  const reset = () => {
    setText('')
    setDismissed(false)
    inputRef.current?.focus()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (blank) return
    onAdd(text.trim())
    reset()
  }

  const pick = (entry: CatalogEntry) => {
    const normalized = text.trim().replace(/\s+/g, ' ')
    const typed = parsed && parsed.name !== normalized ? parsed : null
    onPick?.(entry, typed)
    reset()
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') setDismissed(true)
  }

  return (
    <form
      onSubmit={submit}
      className="sticky top-0 z-10 flex gap-2 bg-white p-4 shadow-sm"
      onKeyDown={onKeyDown}
    >
      <input
        ref={inputRef}
        aria-label={strings.list.addLabel}
        placeholder={strings.list.addPlaceholder}
        value={text}
        onChange={(e) => {
          setText(e.target.value)
          setDismissed(false)
        }}
        enterKeyHint="done"
        autoComplete="off"
        className="min-h-12 min-w-0 flex-1 rounded border border-gray-500 px-3 text-base"
      />
      <button
        type="submit"
        disabled={blank}
        className="min-h-12 min-w-12 rounded bg-green-700 px-4 text-base font-medium text-white disabled:bg-gray-400"
      >
        {strings.list.add}
      </button>
      <Suggestions entries={suggestions} onPick={pick} />
    </form>
  )
}
