import { useState } from 'react'
import { Button } from '@/components/m3/Button'
import { IconButton } from '@/components/m3/IconButton'
import { strings } from '@/strings/pt-BR'
import '../auth.css'

interface Props {
  code: string
  familyName: string
}

/** Shows the invite code and link; shares via the Web Share API or copies the link. */
export function InviteCard({ code, familyName }: Props) {
  const [copied, setCopied] = useState<'link' | 'code' | null>(null)
  const link = `${window.location.origin}/convite/${code}`
  const t = strings.family.invite

  async function share() {
    setCopied(null)
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: strings.appTitle, text: t.shareText(familyName), url: link })
      } catch {
        // user dismissed the share sheet
      }
      return
    }
    await navigator.clipboard.writeText(link)
    setCopied('link')
  }

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied('code')
  }

  return (
    <section className="family-card" aria-label={t.title}>
      <h2 className="auth-heading">{t.title}</h2>
      <div className="family-card__row">
        <strong data-testid="invite-code" className="family-code">
          {code}
        </strong>
        <IconButton icon="content_copy" label={t.copyCode} onClick={() => void copyCode()} />
      </div>
      <p className="family-link">
        {t.link}: <span data-testid="invite-link">{link}</span>
      </p>
      <Button variant="tonal" icon="share" onClick={() => void share()}>
        {t.share}
      </Button>
      {copied && (
        <p role="status" className="family-status">
          {copied === 'code' ? t.codeCopied : t.copied}
        </p>
      )}
    </section>
  )
}
