import { useState } from 'react'
import type { Category } from '@/data/converters'
import { strings } from '@/strings/pt-BR'

const t = strings.categories
const button = 'min-h-12 min-w-12 rounded px-4 text-base font-medium'

interface Props {
  category: Category
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

type Mode = 'view' | 'rename' | 'delete'

export function CategoryRow({ category, onRename, onDelete }: Props) {
  const [mode, setMode] = useState<Mode>('view')
  const [draft, setDraft] = useState(category.name)
  const { id, name, isDefault } = category

  if (mode === 'rename')
    return (
      <li className="flex flex-col gap-2 border-b border-gray-300 p-4">
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (!draft.trim()) return
            onRename(id, draft)
            setMode('view')
          }}
        >
          <label className="flex flex-col gap-1">
            {t.renameLabel(name)}
            <input
              maxLength={40}
              className="min-h-12 w-full rounded border border-gray-400 px-3 text-base"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={!draft.trim()}
              className={`${button} bg-green-700 text-white disabled:opacity-50`}
            >
              {t.save}
            </button>
            <button
              type="button"
              onClick={() => setMode('view')}
              className={`${button} bg-gray-200`}
            >
              {t.cancel}
            </button>
          </div>
        </form>
      </li>
    )

  if (mode === 'delete')
    return (
      <li className="flex flex-col gap-2 border-b border-gray-300 p-4">
        <p>{t.confirmDelete(name)}</p>
        <p className="text-sm">{t.deleteNote}</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onDelete(id)}
            className={`${button} bg-red-700 text-white`}
          >
            {t.confirm}
          </button>
          <button type="button" onClick={() => setMode('view')} className={`${button} bg-gray-200`}>
            {t.cancel}
          </button>
        </div>
      </li>
    )

  return (
    <li className="flex min-h-12 items-center justify-between gap-2 border-b border-gray-300 px-4 py-1">
      <span>
        {name}
        {isDefault && <span className="ml-2 text-sm text-gray-700">({t.defaultTag})</span>}
      </span>
      {!isDefault && (
        <span className="flex gap-2">
          <button
            type="button"
            aria-label={t.renameFor(name)}
            onClick={() => {
              setDraft(name)
              setMode('rename')
            }}
            className={`${button} bg-gray-200`}
          >
            {t.rename}
          </button>
          <button
            type="button"
            aria-label={t.deleteFor(name)}
            onClick={() => setMode('delete')}
            className={`${button} bg-gray-200`}
          >
            {t.delete}
          </button>
        </span>
      )}
    </li>
  )
}
