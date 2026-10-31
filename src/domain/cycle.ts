const CYCLE_RE = /^[0-9]{4}-(0[1-9]|1[0-2])$/

export function isCycle(value: string): boolean {
  return CYCLE_RE.test(value)
}

/** Month of the cycle in the device's local time, e.g. "2026-11". */
export function cycleOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${date.getFullYear()}-${month}`
}

/** "2026-11" -> "novembro de 2026". */
export function formatCycle(cycle: string): string {
  const [year, month] = cycle.split('-').map(Number)
  const name = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(
    new Date(year, month - 1, 1),
  )
  return `${name} de ${year}`
}
