import { parseUnit, type Unit } from './units'

export interface ParsedItem {
  name: string
  quantity: number
  unit: Unit
}

const MAX_NAME = 80
const NUM = '(\\d+(?:[.,]\\d+)?)'
const LEADING = new RegExp(`^${NUM}(\\s*)(.*)$`)
const TRAILING = new RegExp(`^(.*\\S)\\s+${NUM}\\s*(\\S+)$`)

function toNumber(s: string): number {
  return Number(s.replace(',', '.'))
}

function inRange(n: number): boolean {
  return Number.isFinite(n) && n > 0 && n <= 9999
}

function clean(name: string): string {
  return name.trim().slice(0, MAX_NAME).trim()
}

function fallback(text: string): ParsedItem {
  return { name: clean(text), quantity: 1, unit: 'un' }
}

function stripDe(s: string): string {
  return s.replace(/^de(\s+|$)/i, '')
}

function result(rawName: string, quantity: number, unit: Unit): ParsedItem | null {
  const name = clean(rawName)
  return name ? { name, quantity, unit } : null
}

/** Splits free text like "3 kg feijão" into name, quantity and unit. */
export function parseItemText(input: string): ParsedItem | null {
  const text = input.trim().replace(/\s+/g, ' ')
  if (!text) return null

  const lead = LEADING.exec(text)
  if (lead) {
    const qty = toNumber(lead[1]!)
    const spaced = lead[2]!.length > 0
    const rest = lead[3]!
    const [first = '', ...others] = rest.split(' ')
    const after = others.join(' ')
    const unit = parseUnit(first)
    if (unit) {
      return inRange(qty) ? result(stripDe(after), qty, unit) : fallback(text)
    }
    if (/^x$/i.test(first)) {
      return inRange(qty) ? result(after, qty, 'un') : fallback(text)
    }
    if (spaced && rest) {
      return inRange(qty) ? result(rest, qty, 'un') : fallback(text)
    }
    if (!rest) return null
    return fallback(text)
  }

  const trail = TRAILING.exec(text)
  if (trail) {
    const unit = parseUnit(trail[3]!)
    const qty = toNumber(trail[2]!)
    if (unit) return inRange(qty) ? result(trail[1]!, qty, unit) : fallback(text)
  }
  return fallback(text)
}

export function formatQuantity(quantity: number, unit: Unit): string {
  const n = String(quantity).replace('.', ',')
  if (unit === 'un') return n
  return `${n} ${unit === 'l' ? 'L' : unit}`
}
