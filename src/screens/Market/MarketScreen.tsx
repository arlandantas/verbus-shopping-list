import { Link } from 'react-router'
import { useAuth } from '@/app/AuthProvider'
import { useFamily } from '@/app/FamilyProvider'
import { CategorySections } from '@/components/CategorySections'
import { useCategories } from '@/hooks/useCategories'
import { useMemberNames } from '@/hooks/useMemberNames'
import { toggleItemStatus } from '@/data/items'
import { strings } from '@/strings/pt-BR'
import { useItems } from '@/screens/List/useItems'
import { MarketRow } from './MarketRow'

export function MarketScreen() {
  const { family } = useFamily()
  const familyId = family?.id ?? ''
  const items = useItems(familyId)
  const categories = useCategories(family?.id)
  const names = useMemberNames(family?.id)
  const uid = useAuth().user?.uid
  if (!family) return null
  const list = items ?? []
  const done = list.filter((i) => i.status === 'bought').length
  const allDone = list.length > 0 && done === list.length

  return (
    <main className="mx-auto max-w-md pb-8">
      <header className="flex min-h-14 items-center justify-between px-4 pt-2">
        <h1 className="text-xl">{strings.market.title}</h1>
        <Link to="/" className="flex min-h-12 items-center px-2 text-lg underline">
          {strings.market.exit}
        </Link>
      </header>
      {items && list.length === 0 && <p className="p-4">{strings.market.empty}</p>}
      {list.length > 0 && (
        <p className="px-4 py-2 text-lg font-medium" aria-live="polite">
          {strings.market.counter(done, list.length)}
        </p>
      )}
      {allDone && <p className="px-4 pb-2 text-lg text-green-800">{strings.market.allDone}</p>}
      {categories && (
        <CategorySections
          large
          items={list}
          categories={categories}
          renderItem={(item) => (
            <MarketRow
              key={item.id}
              item={item}
              names={names}
              uid={uid}
              onToggle={(i) => toggleItemStatus(familyId, i)}
            />
          )}
        />
      )}
    </main>
  )
}
