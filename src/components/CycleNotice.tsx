import { strings } from '@/strings/pt-BR'

/** Tells the user the month turn put recurring items back on the list (ADR-0013). */
export function CycleNotice({ added, onDismiss }: { added: number; onDismiss: () => void }) {
  if (added <= 0) return null
  return (
    <div
      role="status"
      className="mx-4 mb-2 flex items-center gap-2 rounded border border-gray-700 bg-gray-100 px-3 py-2 text-sm text-gray-900"
    >
      <p className="flex-1">{strings.cycle.returned(added)}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="min-h-12 min-w-12 rounded border border-gray-700 px-3"
      >
        {strings.cycle.ok}
      </button>
    </div>
  )
}
