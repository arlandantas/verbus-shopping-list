import type { CatalogEntry } from '@/data/converters'
import { parseItemText } from './itemText'
import { toNameKey } from './nameKey'
import type { Unit } from './units'

export const MAX_PASTE_ITEMS = 100

export interface PasteRow {
  nameKey: string
  name: string
  quantity: number
  unit: Unit
  categoryId: string | null
  recurring?: boolean
  selected: boolean
  duplicate: boolean
}

export interface PasteResult {
  rows: PasteRow[]
  truncated: boolean
}

// `-1 kg` style is not a marker: ascii markers and numbering need a space (or end of line).
const MARKER = /^\s*(?:(?:[-*+–—]|\d+[.)])(?:\s+|$)|(?:[•·☐☑✅✔]️?|\[[ xX]\])\s*)/

function stripMarkers(line: string): string {
  let cur = line
  for (;;) {
    const next = cur.replace(MARKER, '')
    if (next === cur) return cur.trim()
    cur = next
  }
}

const clean = (parts: string[]) => parts.map(stripMarkers).filter((p) => p !== '')

/** Lines of a pasted list, or null when the text is a single plain entry (ADR-0027). */
export function splitPastedList(text: string): string[] | null {
  const lines = clean(text.split(/\r?\n/))
  if (lines.length >= 2) return lines
  if (lines.length === 0) return null
  const parts = clean(lines[0]!.split(/;|,(?!\d)|(?<!\d),/))
  return parts.length >= 2 ? parts : null
}

export function buildPasteRows(
  lines: readonly string[],
  catalog: readonly CatalogEntry[],
  pendingKeys: ReadonlySet<string>,
): PasteResult {
  const byKey = new Map(catalog.map((e) => [e.nameKey, e]))
  const seen = new Set<string>()
  const rows: PasteRow[] = []
  let truncated = false
  for (const line of lines) {
    const parsed = parseItemText(line)
    if (!parsed) continue
    const nameKey = toNameKey(parsed.name)
    if (seen.has(nameKey)) continue
    if (rows.length >= MAX_PASTE_ITEMS) {
      truncated = true
      break
    }
    seen.add(nameKey)
    const known = byKey.get(nameKey)
    const typed = parsed.name !== line.trim().replace(/\s+/g, ' ')
    const duplicate = pendingKeys.has(nameKey)
    rows.push({
      nameKey,
      name: known ? known.name : parsed.name,
      quantity: typed || !known ? parsed.quantity : known.quantity,
      unit: typed || !known ? parsed.unit : known.unit,
      categoryId: known?.categoryId ?? null,
      ...(known ? { recurring: known.recurring } : {}),
      selected: !duplicate,
      duplicate,
    })
  }
  return { rows, truncated }
}
