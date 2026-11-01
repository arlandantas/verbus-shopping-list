import { useState } from 'react'
import { Dialog } from '@/components/m3/Dialog'
import { Icon } from '@/components/m3/Icon'
import { IconButton } from '@/components/m3/IconButton'
import { ListItem } from '@/components/m3/ListItem'
import type { Category } from '@/data/converters'
import { strings } from '@/strings/pt-BR'
import { NameDialog } from './NameDialog'

const t = strings.categories

interface Props {
  category: Category
  onRename: (id: string, name: string) => void
  onDelete: (id: string) => void
}

type Mode = 'view' | 'rename' | 'delete'

export function CategoryRow({ category, onRename, onDelete }: Props) {
  const [mode, setMode] = useState<Mode>('view')
  const { id, name, isDefault } = category

  if (isDefault)
    return (
      <ListItem
        headline={name}
        tone="muted"
        label={t.defaultLocked(name)}
        trailing={<Icon name="lock" />}
      />
    )

  return (
    <>
      <ListItem
        headline={name}
        trailing={
          <>
            <IconButton icon="edit" label={t.renameFor(name)} onClick={() => setMode('rename')} />
            <IconButton icon="delete" label={t.deleteFor(name)} onClick={() => setMode('delete')} />
          </>
        }
      />
      {mode === 'rename' && (
        <NameDialog
          title={t.renameFor(name)}
          label={t.renameLabel(name)}
          initial={name}
          onClose={() => setMode('view')}
          onSave={(n) => {
            onRename(id, n)
            setMode('view')
          }}
        />
      )}
      {mode === 'delete' && (
        <Dialog
          open
          variant="confirm"
          title={t.confirmDelete(name)}
          confirmLabel={t.confirm}
          cancelLabel={t.cancel}
          onClose={() => setMode('view')}
          onConfirm={() => onDelete(id)}
        >
          {t.deleteNote}
        </Dialog>
      )}
    </>
  )
}
