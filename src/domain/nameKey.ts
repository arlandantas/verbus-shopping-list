import { stripAccents } from './units'

const MAX = 80

/** Lowercase, accent-free, alphanumeric words joined by single spaces (ADR-0008). */
export function toNameKey(name: string): string {
  return stripAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, MAX)
    .trim()
}
