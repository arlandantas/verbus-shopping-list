import { useNavigate } from 'react-router'
import { IconButton } from '@/components/m3/IconButton'
import { strings } from '@/strings/pt-BR'

/** TopAppBar navigation icon: goes to the parent screen `to`. */
export function BackButton({ to }: { to: string }) {
  const navigate = useNavigate()
  return <IconButton icon="arrow_back" label={strings.back} onClick={() => void navigate(to)} />
}
