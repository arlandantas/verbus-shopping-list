export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

type Updatable = { update: () => Promise<unknown> }

/**
 * Checks for a new service worker when the app returns to the foreground and hourly,
 * never more often than every 60 min. Returns a cleanup function.
 */
export function startUpdateChecks(
  registration: Updatable,
  doc: Document = document,
  now: () => number = Date.now,
): () => void {
  let last = now()
  const check = () => {
    if (now() - last < UPDATE_CHECK_INTERVAL_MS) return
    last = now()
    registration.update().catch(() => {
      // offline or transient failure: try again at the next opportunity
    })
  }
  const onVisible = () => {
    if (doc.visibilityState === 'visible') check()
  }
  doc.addEventListener('visibilitychange', onVisible)
  const timer = setInterval(check, UPDATE_CHECK_INTERVAL_MS)
  return () => {
    doc.removeEventListener('visibilitychange', onVisible)
    clearInterval(timer)
  }
}
