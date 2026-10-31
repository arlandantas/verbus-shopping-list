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
