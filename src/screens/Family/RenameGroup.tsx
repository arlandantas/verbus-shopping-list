import { useState } from 'react'
import { Dialog } from '@/components/m3/Dialog'
import { Icon } from '@/components/m3/Icon'
import { TextField } from '@/components/m3/TextField'
import { renameFamily } from '@/data/families'
import { fireAndForget } from '@/data/writeErrors'
import { strings } from '@/strings/pt-BR'
import { GroupRow } from './GroupRow'

interface Props {
  familyId: string
  inviteCode: string
  name: string
}

/** Owner-only "Renomear grupo" row + dialog (S-118, ADR-0030). Optimistic: closes at once. */
export function RenameGroup({ familyId, inviteCode, name }: Props) {
  const t = strings.family.rename
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(name)
  const trimmed = value.trim()

  const openDialog = () => {
    setValue(name)
    setOpen(true)
  }
  const save = () => {
    if (!trimmed) return
    if (trimmed !== name) fireAndForget(renameFamily(familyId, inviteCode, trimmed))
    setOpen(false)
  }

  return (
    <>
      <GroupRow
        icon="edit"
        title={t.row}
        supporting={name}
        onClick={openDialog}
        trailing={<Icon name="chevron_right" />}
      />
      {open && (
        <Dialog
          open
          variant="confirm"
          title={t.title}
          confirmLabel={t.save}
          cancelLabel={t.cancel}
          onClose={() => setOpen(false)}
          onConfirm={save}
        >
          <TextField
            label={strings.family.nameLabel}
            name="groupName"
            maxLength={60}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </Dialog>
      )}
    </>
  )
}
