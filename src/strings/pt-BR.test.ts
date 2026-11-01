import { strings } from './pt-BR'

const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

function collect(v: unknown, out: string[] = []): string[] {
  if (typeof v === 'string') out.push(v)
  else if (typeof v === 'function') {
    try {
      out.push(String((v as (...a: unknown[]) => unknown)('X', 1, 1, 1)))
    } catch {
      // not a plain string template
    }
  } else if (v && typeof v === 'object') Object.values(v).forEach((x) => collect(x, out))
  return out
}

describe('strings', () => {
  it('S-090 AC4: no visible string says "família"', () => {
    const all = collect(strings)
    expect(all.length).toBeGreaterThan(50)
    expect(all.filter((s) => fold(s).includes('familia'))).toEqual([])
  })
})
