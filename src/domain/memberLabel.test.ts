import { memberLabel } from '@/domain/memberLabel'

describe('memberLabel', () => {
  it('S-027 AC3: returns "você", the name, or "alguém"', () => {
    const names = { u1: 'Ana', u2: 'Bia' }
    expect(memberLabel('u1', 'u1', names)).toBe('você')
    expect(memberLabel('u2', 'u1', names)).toBe('Bia')
    expect(memberLabel('u9', 'u1', names)).toBe('alguém')
  })
})
