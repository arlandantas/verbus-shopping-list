import { useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type { CatalogEntry } from '@/data/converters'
import { parseItemText, type ParsedItem } from '@/domain/itemText'
import { suggest } from '@/domain/suggest'
import { strings } from '@/strings/pt-BR'
import { IconButton } from '@/components/m3/IconButton'
import { TextField } from '@/components/m3/TextField'
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
  const [active, setActive] = useState(-1)
  const listId = useId()
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
    setActive(-1)
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

  const open = suggestions.length > 0
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setDismissed(true)
      setActive(-1)
    } else if (open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      const n = suggestions.length
      setActive((a) => (e.key === 'ArrowDown' ? (a + 1) % n : (a <= 0 ? n : a) - 1))
    } else if (open && e.key === 'Enter' && active >= 0 && active < suggestions.length) {
      e.preventDefault()
      pick(suggestions[active])
    }
  }

  return (
    <form onSubmit={submit} className="add-bar">
      <div className="min-w-0 flex-1">
        <TextField
          ref={inputRef}
          label={strings.list.addLabel}
          hideLabel
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
          onKeyDown={onKeyDown}
          placeholder={strings.list.addPlaceholder}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            setDismissed(false)
            setActive(-1)
          }}
          enterKeyHint="done"
          autoComplete="off"
        />
      </div>
      <IconButton
        type="submit"
        variant="filled"
        icon="add"
        label={strings.list.add}
        disabled={blank}
      />
      <Suggestions id={listId} entries={suggestions} active={active} onPick={pick} />
    </form>
  )
}
