import { useState } from 'react'
import type { Category, Item } from '@/data/converters'
import { deleteItem, updateItemDetails, type ItemPatch } from '@/data/items'
import { BottomSheet } from '@/components/m3/BottomSheet'
import { Dialog } from '@/components/m3/Dialog'
import { strings } from '@/strings/pt-BR'
import { ItemForm } from './ItemForm'

interface Props {
  familyId: string
  item: Item
  categories: readonly Category[]
  onClose: () => void
}

/** Reusable "Editar item" bottom sheet (ADR-0020). Mount it only while editing. */
export function EditItemSheet({ familyId, item, categories, onClose }: Props) {
  const [confirming, setConfirming] = useState(false)
  const onSave = (patch: ItemPatch) => {
    if (Object.keys(patch).length > 0) updateItemDetails(familyId, item.id, patch, item)
    onClose()
  }
  const onConfirmDelete = () => {
    deleteItem(familyId, item.id)
    setConfirming(false)
    // let the dialog release its history entry before the sheet releases its own
    setTimeout(onClose, 50)
  }
  return (
    <>
      <BottomSheet open title={strings.item.sheetTitle} onClose={onClose}>
        <ItemForm
          item={item}
          categories={categories}
          onSave={onSave}
          onCancel={onClose}
          onDelete={() => setConfirming(true)}
        />
      </BottomSheet>
      <Dialog
        open={confirming}
        variant="confirm"
        title={strings.item.confirmDelete(item.name)}
        onClose={() => setConfirming(false)}
        onConfirm={onConfirmDelete}
      >
        {null}
      </Dialog>
    </>
  )
}
