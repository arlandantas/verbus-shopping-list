import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { Button } from '@/components/m3/Button'
import { Icon, type IconName } from '@/components/m3/Icon'
import { TextField } from '@/components/m3/TextField'
import { strings } from '@/strings/pt-BR'
import { parseInvite } from './parseInvite'
import './landing.css'

const t = strings.landing

function InviteForm(): ReactNode {
  const navigate = useNavigate()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | undefined>()

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const code = parseInvite(value)
    if (!code) return setError(t.inviteInvalid)
    navigate(`/convite/${code}`)
  }

  return (
    <form className="landing-invite" onSubmit={onSubmit} aria-labelledby="landing-invite-title">
      <h2 id="landing-invite-title" className="landing-invite__title">
        {t.inviteTitle}
      </h2>
      <TextField
        label={t.inviteLabel}
        helper={t.inviteHint}
        error={error}
        value={value}
        autoComplete="off"
        autoCapitalize="characters"
        onChange={(e) => {
          setValue(e.target.value)
          setError(undefined)
        }}
      />
      <Button type="submit" variant="tonal" disabled={!value.trim()}>
        {t.inviteContinue}
      </Button>
    </form>
  )
}

function PhoneMock(): ReactNode {
  return (
    <div className="landing-phone" aria-hidden="true">
      <div className="landing-phone__bar">{t.mockTitle}</div>
      <ul className="landing-phone__list">
        {t.mockItems.map((item, i) => (
          <li key={item} className={i < 2 ? 'is-done' : undefined}>
            <span className="landing-phone__check">{i < 2 && <Icon name="check" size={16} />}</span>
            <span>
              <span className="landing-phone__name">{item}</span>
              {i === 0 && <small>{t.mockWho}</small>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function LandingScreen(): ReactNode {
  const navigate = useNavigate()
  const [inviteOpen, setInviteOpen] = useState(false)
  const toLogin = () => navigate('/entrar')

  return (
    <div className="landing">
      <header className="landing-top">
        <span className="landing-brand">
          <Icon name="shopping_cart" size={24} />
          {t.brand}
        </span>
        <Button variant="text" onClick={toLogin}>
          {t.signIn}
        </Button>
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-hero__copy">
            <h1>{t.heroTitle}</h1>
            <p className="landing-lead">{t.heroSubtitle}</p>
            <div className="landing-cta">
              <Button icon="add" onClick={toLogin}>
                {t.createAccount}
              </Button>
              <Button
                variant="outlined"
                aria-expanded={inviteOpen}
                aria-controls="landing-invite-panel"
                onClick={() => setInviteOpen((o) => !o)}
              >
                {t.haveInvite}
              </Button>
            </div>
            <div id="landing-invite-panel">{inviteOpen && <InviteForm />}</div>
            <p className="landing-note">{t.heroNote}</p>
          </div>
          <PhoneMock />
        </section>

        <section className="landing-section" aria-labelledby="landing-features">
          <h2 id="landing-features">{t.featuresTitle}</h2>
          <ul className="landing-grid">
            {t.features.map((f) => (
              <li key={f.title} className="landing-card">
                <span className="landing-card__icon">
                  <Icon name={f.icon as IconName} size={24} />
                </span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="landing-section" aria-labelledby="landing-steps">
          <h2 id="landing-steps">{t.stepsTitle}</h2>
          <ol className="landing-steps">
            {t.steps.map((s) => (
              <li key={s.title}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-offline">
          <h2>{t.offlineTitle}</h2>
          <p>{t.offlineText}</p>
        </section>

        <section className="landing-final">
          <h2>{t.finalTitle}</h2>
          <div className="landing-cta">
            <Button icon="add" onClick={toLogin}>
              {t.createAccount}
            </Button>
            <Button variant="outlined" onClick={() => setInviteOpen(true)}>
              {t.haveInvite}
            </Button>
          </div>
        </section>
      </main>
      <footer className="landing-footer">{t.footer}</footer>
    </div>
  )
}
