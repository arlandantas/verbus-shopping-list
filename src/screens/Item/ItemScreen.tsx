import { useNavigate, useParams } from 'react-router'
import { useFamily } from '@/app/FamilyProvider'
import { deleteItem, updateItemDetails, type ItemPatch } from '@/data/items'
import { useCategories } from '@/hooks/useCategories'
import { useItems } from '@/screens/List/useItems'
import { BackButton } from '@/components/BackButton'
import { TopAppBar } from '@/components/m3/TopAppBar'
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
      <main className="mx-auto max-w-md">
        <TopAppBar title={strings.item.notFound} navigation={<BackButton to="/" />} />
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
      <TopAppBar title={item.name} navigation={<BackButton to="/" />} />
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
