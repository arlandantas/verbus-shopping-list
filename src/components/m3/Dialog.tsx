import { strings } from '@/strings/pt-BR'
import { Button } from './Button'
import { Overlay, type OverlayProps } from './Overlay'

type Props = OverlayProps & {
  variant?: 'basic' | 'confirm'
  confirmLabel?: string
  cancelLabel?: string
  onConfirm?: () => void
}

export function Dialog({
  variant = 'basic',
  confirmLabel = strings.overlay.confirm,
  cancelLabel = strings.overlay.cancel,
  onConfirm,
  actions,
  onClose,
  ...rest
}: Props) {
  const confirmActions =
    variant === 'confirm' ? (
      <>
        <Button variant="text" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant="text" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </>
    ) : (
      actions
    )
  return <Overlay {...rest} onClose={onClose} actions={confirmActions} kind="dialog" />
}
