import { useEffect, useState, type TouchEvent } from 'react'
import { createPortal } from 'react-dom'
import { Navigate, useNavigate } from 'react-router'
import { useAuth } from '@/app/AuthProvider'
import { useFamily } from '@/app/FamilyProvider'
import { Button } from '@/components/m3/Button'
import { setRecurringEnabled } from '@/data/families'
import { fireAndForget } from '@/data/writeErrors'
import { strings } from '@/strings/pt-BR'
import '@/components/m3/overlay.css'
import { WELCOME_NEXT, hasSeenWelcome, markWelcomeSeen } from './welcomeSeen'

const SWIPE_PX = 50

/** /boas-vindas — three swipeable steps shown once per user and group, as a modal over the navigation (S-110, S-116, ADR-0029). */
export function WelcomeScreen() {
  const { user } = useAuth()
  const family = useFamily()
  const navigate = useNavigate()
  const uid = user?.uid
  const groupId = family.family?.id
  const [seen] = useState(() => !uid || !groupId || hasSeenWelcome(uid, groupId))
  const [step, setStep] = useState(0)
  const [touchX, setTouchX] = useState<number | null>(null)
  const [enabledHere, setEnabledHere] = useState(false)

  useEffect(() => {
    if (uid && groupId) markWelcomeSeen(uid, groupId)
  }, [uid, groupId])

  // The modal covers the page: keep it from scrolling behind.
  useEffect(() => {
    const saved = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = saved
    }
  }, [])

  if (seen || !uid || !groupId || !family.family) return <Navigate to={WELCOME_NEXT} replace />

  const t = strings.welcome
  const last = t.steps.length - 1
  const current = t.steps[step]
  const recurringOn = family.family.recurringEnabled
  const finish = () => void navigate(WELCOME_NEXT, { replace: true })
  const go = (delta: number) => setStep((s) => Math.min(last, Math.max(0, s + delta)))

  const onTouchEnd = (e: TouchEvent) => {
    if (touchX === null) return
    const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX
    setTouchX(null)
    if (Math.abs(dx) >= SWIPE_PX) go(dx < 0 ? 1 : -1)
  }

  return createPortal(
    <div className="m3-overlay m3-overlay--dialog">
      <div className="m3-scrim" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-title"
        className="m3-overlay__panel"
        onTouchStart={(e) => setTouchX(e.touches[0]?.clientX ?? null)}
        onTouchEnd={onTouchEnd}
      >
        <div className="m3-overlay__header">
          <p className="m-0 text-sm">{t.stepOf(step + 1, t.steps.length)}</p>
          <Button variant="text" onClick={finish}>
            {t.skip}
          </Button>
        </div>
        <section className="m3-overlay__body flex flex-col gap-3">
          <h1 id="welcome-title" className="m-0 text-2xl font-medium">
            {current?.title}
          </h1>
          <p className="m-0">{current?.text}</p>
          {step === last &&
            (recurringOn || enabledHere ? (
              enabledHere && <p role="status">{t.activated}</p>
            ) : (
              <>
                <p>{t.activateHint}</p>
                <Button
                  variant="tonal"
                  onClick={() => {
                    setEnabledHere(true)
                    fireAndForget(setRecurringEnabled(groupId, true))
                  }}
                >
                  {t.activate}
                </Button>
              </>
            ))}
        </section>
        <div className="m3-overlay__actions">
          {step > 0 && (
            <Button variant="outlined" onClick={() => go(-1)}>
              {t.back}
            </Button>
          )}
          {step < last ? (
            <Button onClick={() => go(1)}>{t.next}</Button>
          ) : (
            <Button onClick={finish}>{t.done}</Button>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
