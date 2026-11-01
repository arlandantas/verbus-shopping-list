import { Overlay, type OverlayProps } from './Overlay'

export function BottomSheet(props: OverlayProps) {
  return <Overlay {...props} kind="sheet" />
}
