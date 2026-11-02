import { isValidInviteCode, normalizeInviteCode } from '@/domain/inviteCode'

/** Accepts a pasted invite link (…/convite/CODE) or a bare code; returns the code or null. */
export function parseInvite(input: string): string | null {
  const fromLink = /\/convite\/([A-Za-z0-9-]{1,32})/.exec(input)
  const code = normalizeInviteCode(fromLink ? fromLink[1] : input)
  return isValidInviteCode(code) ? code : null
}
