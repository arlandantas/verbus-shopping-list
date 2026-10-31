import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  initializeApp: vi.fn(() => ({ name: 'app' })),
  getAuth: vi.fn(() => ({ name: 'auth' })),
  connectAuthEmulator: vi.fn(),
  initializeFirestore: vi.fn(() => ({ name: 'db' })),
  connectFirestoreEmulator: vi.fn(),
  persistentLocalCache: vi.fn((o: unknown) => ({ cache: o })),
  persistentMultipleTabManager: vi.fn(() => ({ tab: 'multi' })),
}))

vi.mock('firebase/app', () => ({ initializeApp: m.initializeApp }))
vi.mock('firebase/auth', () => ({
  getAuth: m.getAuth,
  connectAuthEmulator: m.connectAuthEmulator,
}))
vi.mock('firebase/firestore', () => ({
  initializeFirestore: m.initializeFirestore,
  connectFirestoreEmulator: m.connectFirestoreEmulator,
  persistentLocalCache: m.persistentLocalCache,
  persistentMultipleTabManager: m.persistentMultipleTabManager,
}))

async function load() {
  vi.resetModules()
  return import('./firebase')
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

describe('S-003 AC3: emulator connection', () => {
  it('connects to emulators when VITE_USE_EMULATOR is "true"', async () => {
    vi.stubEnv('VITE_USE_EMULATOR', 'true')
    await load()
    expect(m.connectAuthEmulator).toHaveBeenCalledTimes(1)
    expect(m.connectFirestoreEmulator).toHaveBeenCalledWith({ name: 'db' }, '127.0.0.1', 8080)
  })

  it('does not connect to emulators otherwise', async () => {
    vi.stubEnv('VITE_USE_EMULATOR', 'false')
    await load()
    expect(m.connectAuthEmulator).not.toHaveBeenCalled()
    expect(m.connectFirestoreEmulator).not.toHaveBeenCalled()
  })
})

describe('S-003 AC4: persistent cache', () => {
  it('initializes Firestore with persistentLocalCache + persistentMultipleTabManager', async () => {
    await load()
    expect(m.persistentMultipleTabManager).toHaveBeenCalled()
    expect(m.persistentLocalCache).toHaveBeenCalledWith({ tabManager: { tab: 'multi' } })
    expect(m.initializeFirestore).toHaveBeenCalledWith(
      { name: 'app' },
      { localCache: { cache: { tabManager: { tab: 'multi' } } } },
    )
  })
})
