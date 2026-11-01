import { useState } from 'react'
import { BackButton } from '@/components/BackButton'
import { Button } from '@/components/m3/Button'
import { TopAppBar } from '@/components/m3/TopAppBar'
import { useFamily } from '@/app/FamilyProvider'
import { addCategory, deleteCategory, renameCategory } from '@/data/categories'
import { useCategories } from '@/hooks/useCategories'
import { strings } from '@/strings/pt-BR'
import { CategoryRow } from './CategoryRow'
import { NameDialog } from './NameDialog'
import './categories.css'

const t = strings.categories

export function CategoriesScreen() {
  const { family } = useFamily()
  const familyId = family?.id ?? ''
  const categories = useCategories(family?.id)
  const [creating, setCreating] = useState(false)
  if (!family) return null

  const all = categories ?? []
  const own = all.filter((c) => !c.isDefault)
  const defaults = all.filter((c) => c.isDefault)
  const row = (c: (typeof all)[number]) => (
    <CategoryRow
      key={c.id}
      category={c}
      onRename={(id, n) => renameCategory(familyId, id, n)}
      onDelete={(id) => deleteCategory(familyId, id)}
    />
  )

  return (
    <main className="mx-auto max-w-md">
      <TopAppBar title={t.title} navigation={<BackButton to="/familia" />} />
      <h2 className="categories-section">{t.userSection}</h2>
      {own.length === 0 && <p className="categories-empty">{t.emptyUser}</p>}
      <ul aria-label={t.userList} className="categories-list">
        {own.map(row)}
      </ul>
      <div className="categories-new">
        <Button variant="tonal" icon="add" onClick={() => setCreating(true)}>
          {t.newLabel}
        </Button>
      </div>
      <h2 className="categories-section">{t.defaultSection}</h2>
      <ul aria-label={t.defaultList} className="categories-list">
        {defaults.map(row)}
      </ul>
      {creating && (
        <NameDialog
          title={t.newLabel}
          label={t.nameLabel}
          initial=""
          onClose={() => setCreating(false)}
          onSave={(n) => {
            addCategory(familyId, n, all)
            setCreating(false)
          }}
        />
      )}
    </main>
  )
}
