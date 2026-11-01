import { useEffect, useState } from 'react'
import { setWriteErrorHandler } from '@/data/writeErrors'
import { strings } from '@/strings/pt-BR'

/** Registers the central write-error handler (ADR-0004) and shows a dismissible pt-BR alert. */
export function WriteErrorNotice() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setWriteErrorHandler((error) => {
      console.error('write failed', error)
      setVisible(true)
    })
    return () => setWriteErrorHandler()
  }, [])
  if (!visible) return null
  return (
    <div
      role="alert"
      className="fixed inset-x-0 bottom-[var(--app-bottom-inset,0px)] z-30 flex items-center gap-2 bg-red-800 px-4 py-2 text-sm text-white"
    >
      <p className="flex-1">{strings.writeError}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="min-h-12 min-w-12 rounded border border-white px-3"
      >
        {strings.dismiss}
      </button>
    </div>
  )
}
