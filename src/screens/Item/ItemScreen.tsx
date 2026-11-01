import { Link, useNavigate, useParams } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { deleteItem, updateItemDetails, type ItemPatch } from '@/data/items'
import { useCategories } from '@/hooks/useCategories'
import { useItems } from '@/screens/List/useItems'
import { Loading } from '@/components/Loading'
import { strings } from '@/strings/pt-BR'
import { ItemForm } from './ItemForm'

export function ItemScreen() {
  const { id = '' } = useParams()
  const { family } = useFamily()
  const familyId = family?.id ?? ''
  const items = useItems(familyId)
  const categories = useCategories(familyId)
  const navigate = useNavigate()
  if (!family || items === null || categories === null) return <Loading />
  const item = items.find((i) => i.id === id)
  if (!item)
    return (
      <main className="mx-auto flex max-w-md flex-col gap-4 p-4">
        <p>{strings.item.notFound}</p>
        <Link to="/" className="flex min-h-12 items-center underline">
          {strings.item.toList}
        </Link>
      </main>
    )

  const onSave = (patch: ItemPatch) => {
    if (Object.keys(patch).length > 0) updateItemDetails(familyId, id, patch, item)
    navigate('/')
  }
  const onDelete = () => {
    deleteItem(familyId, id)
    navigate('/')
  }
  return (
    <main className="mx-auto max-w-md">
      <header className="flex min-h-12 items-center gap-3 px-4 pt-2">
        <Link to="/" className="flex min-h-12 items-center underline">
          {strings.item.back}
        </Link>
        <h1 className="text-xl">{item.name}</h1>
      </header>
      <ItemForm
        familyId={familyId}
        item={item}
        categories={categories}
        onSave={onSave}
        onDelete={onDelete}
      />
    </main>
  )
}
