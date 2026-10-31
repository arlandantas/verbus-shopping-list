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
