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
  const [copied, setCopied] = useState<'link' | 'code' | 'failed' | null>(null)
  const link = `${window.location.origin}${import.meta.env.BASE_URL}convite/${code}`
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
    await copyText(link, 'link')
  }

  async function copyText(text: string, ok: 'link' | 'code') {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(ok)
    } catch {
      setCopied('failed')
    }
  }

  return (
    <section className="family-card" aria-label={t.title}>
      <h2 className="auth-heading">{t.title}</h2>
      <div className="family-card__row">
        <strong data-testid="invite-code" className="family-code">
          {code}
        </strong>
        <IconButton
          icon="content_copy"
          label={t.copyCode}
          onClick={() => void copyText(code, 'code')}
        />
      </div>
      <p className="family-link">
        {t.link}: <span data-testid="invite-link">{link}</span>
      </p>
      <Button variant="tonal" icon="share" onClick={() => void share()}>
        {t.share}
      </Button>
      {copied && (
        <p role="status" className="family-status">
          {copied === 'code' ? t.codeCopied : copied === 'failed' ? t.copyFailed : t.copied}
        </p>
      )}
    </section>
  )
}
