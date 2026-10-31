import { describe, expect, it } from 'vitest'
import { generateInviteCode, isValidInviteCode, normalizeInviteCode } from './inviteCode'

describe('S-009 AC1: invite codes', () => {
  it('generates 8 chars from the ADR-0003 alphabet', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateInviteCode()).toMatch(/^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{8}$/)
    }
  })

  it('normalizes case, spaces and dashes', () => {
    expect(normalizeInviteCode(' abcd-2345 ')).toBe('ABCD2345')
  })

  it('accepts generated codes', () => {
    expect(isValidInviteCode(generateInviteCode())).toBe(true)
  })

  it.each(['0', 'O', '1', 'I', 'L'])('rejects codes containing %s', (ch) => {
    expect(isValidInviteCode(`ABCD234${ch}`)).toBe(false)
  })

  it('rejects wrong length', () => {
    expect(isValidInviteCode('ABCD234')).toBe(false)
    expect(isValidInviteCode('ABCD23456')).toBe(false)
  })
})
