// Central sink for un-awaited writes (ADR-0004): the UI registers a handler that shows a pt-BR notice.
type Handler = (error: unknown) => void

const defaultHandler: Handler = (error) => console.error('write failed', error)
let handler: Handler = defaultHandler

/** Registers the UI handler; call with no argument to restore the console default. */
export function setWriteErrorHandler(h?: Handler): void {
  handler = h ?? defaultHandler
}

export function reportWriteError(error: unknown): void {
  handler(error)
}

/** Fire-and-forget: the local snapshot already reflects the write; failures go to the handler. */
export function fireAndForget(write: Promise<unknown>): void {
  write.catch(reportWriteError)
}
