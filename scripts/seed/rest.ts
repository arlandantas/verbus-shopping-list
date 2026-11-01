// Minimal Auth + Firestore REST helpers for the emulators (no extra dependency). Writes go
// through real ID tokens, so the real firestore.rules are enforced on every seeded document.
export interface Endpoints {
  auth: string
  firestore: string
  projectId: string
}

export const DEFAULT_ENDPOINTS: Endpoints = {
  auth: 'http://127.0.0.1:9099',
  firestore: 'http://127.0.0.1:8080',
  projectId: 'demo-verbus',
}

/** Marker for `request.time` fields (the rules require createdAt == request.time). */
export const SERVER_TIME = { serverTime: true } as const
export type Value = string | number | boolean | null | Value[] | typeof SERVER_TIME

type Fv = Record<string, unknown>
function encode(v: Exclude<Value, typeof SERVER_TIME>): Fv {
  if (v === null) return { nullValue: null }
  if (typeof v === 'string') return { stringValue: v }
  if (typeof v === 'boolean') return { booleanValue: v }
  if (typeof v === 'number')
    return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v }
  return { arrayValue: { values: v.map((x) => encode(x as Exclude<Value, typeof SERVER_TIME>)) } }
}

export interface Session {
  uid: string
  token: string
}

export interface WriteOpts {
  /** true = must not exist (create); false/undefined with mask = must exist (update). */
  create?: boolean
  /** Restrict the update to these fields (merge); omit for a full replace. */
  mask?: string[]
}

export class Rest {
  readonly ep: Endpoints
  constructor(ep: Endpoints = DEFAULT_ENDPOINTS) {
    this.ep = ep
  }

  private get base() {
    return `${this.ep.firestore}/v1/projects/${this.ep.projectId}/databases/(default)/documents`
  }

  /** Signs up the account, or signs in when it already exists (idempotent). */
  async account(email: string, password: string, displayName: string): Promise<Session> {
    const idt = `${this.ep.auth}/identitytoolkit.googleapis.com/v1/accounts`
    const post = (op: string, body: object) =>
      fetch(`${idt}:${op}?key=fake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    const payload = { email, password, returnSecureToken: true }
    let res = await post('signUp', { ...payload, displayName })
    if (!res.ok) res = await post('signInWithPassword', payload)
    if (!res.ok) throw new Error(`auth failed for ${email}: ${res.status}`)
    const j = (await res.json()) as { localId: string; idToken: string }
    return { uid: j.localId, token: j.idToken }
  }

  async get(s: Session, path: string): Promise<Record<string, Fv> | null> {
    const res = await fetch(`${this.base}/${path}`, {
      headers: { Authorization: `Bearer ${s.token}` },
    })
    if (res.status === 404) return null
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
    return ((await res.json()) as { fields?: Record<string, Fv> }).fields ?? {}
  }

  async hasDocs(s: Session, collectionPath: string): Promise<boolean> {
    const res = await fetch(`${this.base}/${collectionPath}?pageSize=1`, {
      headers: { Authorization: `Bearer ${s.token}` },
    })
    if (!res.ok) throw new Error(`LIST ${collectionPath} failed: ${res.status}`)
    return ((await res.json()) as { documents?: unknown[] }).documents?.length ? true : false
  }

  /** One atomic commit of several document writes, authorised as `s`. */
  async commit(s: Session, writes: Write[]): Promise<void> {
    const name = (p: string) => `projects/${this.ep.projectId}/databases/(default)/documents/${p}`
    const body = writes.map((w) => {
      const fields: Record<string, Fv> = {}
      const transforms: object[] = []
      for (const [k, v] of Object.entries(w.data)) {
        if (v === SERVER_TIME) transforms.push({ fieldPath: k, setToServerValue: 'REQUEST_TIME' })
        else fields[k] = encode(v as Exclude<Value, typeof SERVER_TIME>)
      }
      return {
        update: { name: name(w.path), fields },
        ...(w.mask ? { updateMask: { fieldPaths: w.mask } } : {}),
        ...(transforms.length ? { updateTransforms: transforms } : {}),
        currentDocument: { exists: !w.create },
      }
    })
    const res = await fetch(`${this.base}:commit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${s.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes: body }),
    })
    if (!res.ok) {
      const paths = writes.map((w) => w.path).join(', ')
      throw new Error(`commit denied/failed (${res.status}) for ${paths}: ${await res.text()}`)
    }
  }
}

export interface Write extends WriteOpts {
  path: string
  data: Record<string, Value>
}
