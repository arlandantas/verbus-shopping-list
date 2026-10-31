import { readFileSync } from 'node:fs'
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc } from 'firebase/firestore'

let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-verbus',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})

afterAll(async () => {
  await env.cleanup()
})

describe('S-003 AC2: deny-all rules', () => {
  it('denies read and write on families/x for an authenticated user', async () => {
    const ref = doc(env.authenticatedContext('alice').firestore(), 'families/x')
    await assertFails(getDoc(ref))
    await assertFails(setDoc(ref, { name: 'x' }))
  })

  it('denies read and write on families/x for an anonymous user', async () => {
    const ref = doc(env.unauthenticatedContext().firestore(), 'families/x')
    await assertFails(getDoc(ref))
    await assertFails(setDoc(ref, { name: 'x' }))
  })
})
