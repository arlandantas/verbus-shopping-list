import { useState } from 'react'
import { rotateInviteCode } from '@/data/families'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { Dialog } from '@/components/m3/Dialog'
import { Button } from '@/components/m3/Button'
import { IconButton } from '@/components/m3/IconButton'
import { strings } from '@/strings/pt-BR'
import '../auth.css'

interface Props {
  familyId: string
  code: string
  familyName: string
}

/** Shows the invite code and link; shares via the Web Share API or copies the link. */
export function InviteCard({ familyId, code, familyName }: Props) {
  const [copied, setCopied] = useState<'link' | 'code' | 'failed' | null>(null)
  const online = useOnlineStatus()
  const [confirming, setConfirming] = useState(false)
  const [rotateError, setRotateError] = useState(false)
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

  async function rotate() {
    setConfirming(false)
    setRotateError(false)
    setCopied(null)
    try {
      await rotateInviteCode(familyId) // the family snapshot brings the new code
    } catch {
      setRotateError(true)
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
      <Button variant="tonal" disabled={!online} onClick={() => setConfirming(true)}>
        {t.rotate}
      </Button>
      {!online && <p className="auth-warning">{t.rotateOffline}</p>}
      {rotateError && (
        <p role="alert" className="auth-error">
          {t.rotateError}
        </p>
      )}
      {confirming && (
        <Dialog
          open
          variant="confirm"
          title={t.rotateTitle}
          confirmLabel={t.rotateConfirm}
          cancelLabel={t.rotateCancel}
          onClose={() => setConfirming(false)}
          onConfirm={() => void rotate()}
        >
          {t.rotateNote}
        </Dialog>
      )}
      {copied && (
        <p role="status" className="family-status">
          {copied === 'code' ? t.codeCopied : copied === 'failed' ? t.copyFailed : t.copied}
        </p>
      )}
    </section>
  )
}
