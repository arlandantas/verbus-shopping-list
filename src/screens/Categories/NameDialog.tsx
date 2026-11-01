import { useState } from 'react'
import { Button } from '@/components/m3/Button'
import { Dialog } from '@/components/m3/Dialog'
import { TextField } from '@/components/m3/TextField'
import { strings } from '@/strings/pt-BR'

const t = strings.categories

interface Props {
  title: string
  label: string
  initial: string
  onSave: (name: string) => void
  onClose: () => void
}

/** Create/rename dialog; name must have 1-40 characters. */
export function NameDialog({ title, label, initial, onSave, onClose }: Props) {
  const [draft, setDraft] = useState(initial)
  const [error, setError] = useState(false)

  function submit() {
    const name = draft.trim()
    if (!name) {
      setError(true)
      return
    }
    onSave(name)
  }

  return (
    <Dialog
      open
      title={title}
      onClose={onClose}
      actions={
        <>
          <Button variant="text" onClick={onClose}>
            {t.cancel}
          </Button>
          <Button variant="text" onClick={submit}>
            {t.save}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <TextField
          label={label}
          value={draft}
          maxLength={40}
          counter
          error={error ? t.nameEmpty : undefined}
          onChange={(e) => {
            setDraft(e.target.value)
            setError(false)
          }}
        />
      </form>
    </Dialog>
  )
}
