// ADR-0003: 8 chars, no 0/O/1/I/L.
export const INVITE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
export const INVITE_CODE_LENGTH = 8

const VALID = new RegExp(`^[${INVITE_ALPHABET}]{${INVITE_CODE_LENGTH}}$`)

export function generateInviteCode(): string {
  const n = INVITE_ALPHABET.length
  const limit = 256 - (256 % n) // rejection sampling avoids modulo bias
  let code = ''
  while (code.length < INVITE_CODE_LENGTH) {
    for (const b of crypto.getRandomValues(new Uint8Array(16))) {
      if (b < limit && code.length < INVITE_CODE_LENGTH) code += INVITE_ALPHABET[b % n]
    }
  }
  return code
}

export function normalizeInviteCode(input: string): string {
  return input.replace(/[\s-]/g, '').toUpperCase()
}

export function isValidInviteCode(code: string): boolean {
  return VALID.test(code)
}
