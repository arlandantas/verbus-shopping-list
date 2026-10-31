import { strings } from '@/strings/pt-BR'

/** "por você" / "por Ana" / "por alguém" for a bought item; nothing while pending (ADR-0011). */
export function MarkedBy({
  status,
  markedBy,
  names,
  uid,
}: {
  status: 'pending' | 'bought'
  markedBy: string | null
  names: Record<string, string>
  uid: string | undefined
}) {
  if (status !== 'bought') return null
  const text =
    markedBy && markedBy === uid
      ? strings.markedBy.you
      : markedBy && names[markedBy]
        ? strings.markedBy.by(names[markedBy])
        : strings.markedBy.someone
  return <span className="text-sm text-gray-700 no-underline">{text}</span>
}
