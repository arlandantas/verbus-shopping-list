import { useState } from 'react'
import { strings } from '@/strings/pt-BR'

interface Props {
  code: string
  familyName: string
}

/** Shows the invite code and link; shares via the Web Share API or copies the link. */
export function InviteCard({ code, familyName }: Props) {
  const [copied, setCopied] = useState(false)
  const link = `${window.location.origin}/convite/${code}`
  const t = strings.family.invite

  async function share() {
    setCopied(false)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: strings.appTitle, text: t.shareText(familyName), url: link })
      } catch {
        // user dismissed the share sheet
      }
      return
    }
    await navigator.clipboard.writeText(link)
    setCopied(true)
  }

  return (
    <section className="flex flex-col gap-2 rounded border border-gray-400 p-4">
      <h2 className="text-lg font-medium">{t.title}</h2>
      <p>
        {t.code}:{' '}
        <strong data-testid="invite-code" className="font-mono text-xl tracking-widest">
          {code}
        </strong>
      </p>
      <p className="break-all">
        {t.link}: <span data-testid="invite-link">{link}</span>
      </p>
      <button
        type="button"
        onClick={() => void share()}
        className="min-h-12 rounded bg-green-700 px-4 font-medium text-white"
      >
        {t.share}
      </button>
      {copied && (
        <p role="status" className="text-green-800">
          {t.copied}
        </p>
      )}
    </section>
  )
}
