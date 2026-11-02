import { useEffect, useState } from 'react'
import { strings } from '@/strings/pt-BR'

export const LOADING_TIMEOUT_MS = 15000

/** "Carregando…" that never lasts forever: after a while it offers a pt-BR error with retry. */
export function Loading({ timeoutMs = LOADING_TIMEOUT_MS }: { timeoutMs?: number }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setSlow(true), timeoutMs)
    return () => clearTimeout(t)
  }, [timeoutMs])
  if (!slow)
    return (
      <div className="splash" role="status">
        <img src={`${import.meta.env.BASE_URL}icons/icon-192.png`} alt="" />
        <div className="splash__spinner" aria-hidden="true" />
        <p>{strings.loading}</p>
      </div>
    )
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-4 p-4">
      <p role="alert">{strings.loadTimeout}</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="min-h-12 w-full rounded bg-primary px-4 text-base font-medium text-on-primary"
      >
        {strings.retry}
      </button>
    </div>
  )
}
