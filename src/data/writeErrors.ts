// Central sink for un-awaited writes (ADR-0004): the UI registers a handler that shows a pt-BR notice.
type Handler = (error: unknown) => void

let handler: Handler = (error) => console.error('write failed', error)

export function setWriteErrorHandler(h: Handler): void {
  handler = h
}

export function reportWriteError(error: unknown): void {
  handler(error)
}

/** Fire-and-forget: the local snapshot already reflects the write; failures go to the handler. */
export function fireAndForget(write: Promise<unknown>): void {
  write.catch(reportWriteError)
}
