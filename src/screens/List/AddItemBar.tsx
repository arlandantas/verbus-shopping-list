import { useRef, useState, type FormEvent } from 'react'
import { strings } from '@/strings/pt-BR'

export function AddItemBar({ onAdd }: { onAdd: (text: string) => void }) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const blank = text.trim() === ''

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (blank) return
    onAdd(text.trim())
    setText('')
    inputRef.current?.focus()
  }

  return (
    <form onSubmit={submit} className="sticky top-0 z-10 flex gap-2 bg-white p-4 shadow-sm">
      <input
        ref={inputRef}
        aria-label={strings.list.addLabel}
        placeholder={strings.list.addPlaceholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
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
    </form>
  )
}
