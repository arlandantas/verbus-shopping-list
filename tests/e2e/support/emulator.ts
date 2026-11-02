import { expect } from '@playwright/test'

const PROJECT = 'demo-verbus'
const AUTH = 'http://127.0.0.1:9099'
const FIRESTORE = 'http://127.0.0.1:8080'

async function del(url: string): Promise<void> {
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) throw new Error(`DELETE ${url} failed: ${res.status}`)
}

/** Wipes all Auth accounts and Firestore documents of the emulator project. */
export async function clearEmulators(): Promise<void> {
  await Promise.all([
    del(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`),
    del(`${FIRESTORE}/emulator/v1/projects/${PROJECT}/databases/(default)/documents`),
  ])
}

interface DocList {
  documents?: { name: string }[]
}

/** Deletes every item document (not the catalog) via the emulator admin API; stands in for a delete UI. */
export async function deleteAllItems(): Promise<void> {
  const base = `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents`
  const headers = { Authorization: 'Bearer owner' }
  const fams = (await (await fetch(`${base}/families`, { headers })).json()) as DocList
  for (const fam of fams.documents ?? []) {
    const path = fam.name.split('/documents/')[1]!
    const items = (await (await fetch(`${base}/${path}/items`, { headers })).json()) as DocList
    for (const it of items.documents ?? []) {
      const p = it.name.split('/documents/')[1]!
      const res = await fetch(`${base}/${p}`, { method: 'DELETE', headers })
      if (!res.ok) throw new Error(`DELETE ${p} failed: ${res.status}`)
    }
  }
}

/** Resolves once the emulator holds `count` item documents, i.e. the client writes reached the server. */
export async function waitForItemCount(count: number): Promise<void> {
  const base = `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents`
  const headers = { Authorization: 'Bearer owner' }
  await expect
    .poll(async () => {
      const fams = (await (await fetch(`${base}/families`, { headers })).json()) as DocList
      let total = 0
      for (const fam of fams.documents ?? []) {
        const path = fam.name.split('/documents/')[1]!
        const items = (await (await fetch(`${base}/${path}/items`, { headers })).json()) as DocList
        total += items.documents?.length ?? 0
      }
      return total
    })
    .toBe(count)
}

const SEED_ORDER = ['Mercearia', 'Hortifrúti', 'Carnes', 'Laticínios', 'Limpeza', 'Higiene pessoal']

/**
 * Adds a user category if absent (isDefault false) in every family via the emulator admin API. New groups
 * start without categories (S-092), so specs that need one create it here instead of through the UI.
 */
export async function seedCategory(name: string): Promise<void> {
  const base = `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents`
  const headers = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }
  const fams = (await (await fetch(`${base}/families`, { headers })).json()) as DocList
  const idx = SEED_ORDER.indexOf(name)
  const fields = {
    name: { stringValue: name },
    isDefault: { booleanValue: false },
    order: { integerValue: String(idx === -1 ? 10 : idx) },
  }
  for (const fam of fams.documents ?? []) {
    const path = fam.name.split('/documents/')[1]!
    const existing = (await (await fetch(`${base}/${path}/categories`, { headers })).json()) as {
      documents?: { fields?: { name?: { stringValue?: string } } }[]
    }
    if (existing.documents?.some((d) => d.fields?.name?.stringValue === name)) continue
    const id = `e2e-${name.toLowerCase().replace(/[^a-z]/g, '')}`
    const res = await fetch(`${base}/${path}/categories/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields }),
    })
    if (!res.ok) throw new Error(`PATCH ${id} failed: ${res.status}`)
  }
}

/** Removes `recurringEnabled` from every family via the admin API: stands in for a pre-S-105 (legacy) group. */
export async function makeFamiliesLegacy(): Promise<void> {
  const base = `${FIRESTORE}/v1/projects/${PROJECT}/databases/(default)/documents`
  const headers = { Authorization: 'Bearer owner', 'Content-Type': 'application/json' }
  const fams = (await (await fetch(`${base}/families`, { headers })).json()) as DocList
  for (const fam of fams.documents ?? []) {
    const path = fam.name.split('/documents/')[1]!
    const res = await fetch(`${base}/${path}?updateMask.fieldPaths=recurringEnabled`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ fields: {} }),
    })
    if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`)
  }
}
