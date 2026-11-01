import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { addCategory, deleteCategory, renameCategory } from '@/data/categories'
import { useCategories } from '@/hooks/useCategories'
import { strings } from '@/strings/pt-BR'
import { CategoryRow } from './CategoryRow'

const t = strings.categories

export function CategoriesScreen() {
  const { family } = useFamily()
  const familyId = family?.id ?? ''
  const categories = useCategories(family?.id)
  const [name, setName] = useState('')
  const [error, setError] = useState(false)
  if (!family) return null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError(true)
      return
    }
    addCategory(familyId, name.trim(), categories ?? [])
    setName('')
    setError(false)
  }

  return (
    <main className="mx-auto max-w-md">
      <header className="flex min-h-12 items-center justify-between px-4 pt-2">
        <h1 className="text-xl">{t.title}</h1>
        <Link to="/familia" className="flex min-h-12 items-center underline">
          {t.back}
        </Link>
      </header>
      <form onSubmit={onSubmit} className="flex flex-col gap-2 p-4">
        <label className="flex flex-col gap-1">
          {t.newLabel}
          <input
            maxLength={40}
            className="min-h-12 w-full rounded border border-gray-400 px-3 text-base"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        {error && (
          <p role="alert" className="text-red-700">
            {t.nameEmpty}
          </p>
        )}
        <button
          type="submit"
          className="min-h-12 w-full rounded bg-green-700 px-4 text-base font-medium text-white"
        >
          {t.add}
        </button>
      </form>
      <ul aria-label={t.listLabel}>
        {(categories ?? []).map((c) => (
          <CategoryRow
            key={c.id}
            category={c}
            onRename={(id, n) => renameCategory(familyId, id, n)}
            onDelete={(id) => deleteCategory(familyId, id)}
          />
        ))}
      </ul>
    </main>
  )
}
