// S-086: proves the production bundle carries nothing from the emulator-only quick login (S-050)
// and never wires emulators. Builds into temp dirs (dist/ is untouched). Run: pnpm check:bundle
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { TEST_ACCOUNTS } from './seed/accounts.ts'
import { devStrings } from '../src/strings/pt-BR.ts'

const FAKE_FIREBASE = {
  VITE_FIREBASE_API_KEY: 'AIzaSyA-fake0000000000000000000000000000',
  VITE_FIREBASE_AUTH_DOMAIN: 'fake-project.firebaseapp.com',
  VITE_FIREBASE_PROJECT_ID: 'fake-project',
  VITE_FIREBASE_APP_ID: '1:123456789012:web:0123456789abcdef012345',
}

function files(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? files(p) : [p]
  })
}

/** Builds with the given env into a temp dir and returns { file, text } for every output file. */
function build(extraEnv) {
  const outDir = mkdtempSync(join(tmpdir(), 'verbus-check-bundle-'))
  try {
    const env = { ...process.env, ...FAKE_FIREBASE, ...extraEnv }
    if (!extraEnv.VITE_USE_EMULATOR) delete env.VITE_USE_EMULATOR
    const r = spawnSync(
      'pnpm',
      ['exec', 'vite', 'build', '--mode', 'production', '--outDir', outDir, '--emptyOutDir'],
      { env, encoding: 'utf8' },
    )
    if (r.status !== 0) throw new Error(`build failed:\n${r.stdout}\n${r.stderr}`)
    return files(outDir).map((f) => ({
      file: f.slice(outDir.length + 1),
      text: readFileSync(f, 'utf8'),
    }))
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
}

const forbidden = [
  devStrings.testAccounts,
  devStrings.emulatorNotFound,
  '127.0.0.1:9099',
  '127.0.0.1:8080',
  ...TEST_ACCOUNTS.flatMap((a) => [a.email, a.password]),
]
const forbiddenRegex = [
  /connectFirestoreEmulator\s*\(\s*\w+\s*,\s*["'`]/,
  /connectAuthEmulator\s*\(\s*\w+\s*,\s*["'`]http/,
]

const problems = []
for (const [label, env] of [
  ['production', {}],
  ['production (VITE_BASE=/verbus-shopping-list/)', { VITE_BASE: '/verbus-shopping-list/' }],
]) {
  for (const { file, text } of build(env)) {
    for (const s of forbidden)
      if (text.includes(s)) problems.push(`${label}: ${file} contains "${s}"`)
    for (const re of forbiddenRegex)
      if (re.test(text)) problems.push(`${label}: ${file} matches ${re}`)
  }
}

// Positive control: with the emulator flag the panel must be found, or the scan above proves nothing.
const control = build({ VITE_USE_EMULATOR: 'true' })
if (!control.some(({ text }) => text.includes(devStrings.testAccounts))) {
  problems.push('control build (VITE_USE_EMULATOR=true) does not contain the quick-login panel')
}

if (problems.length) {
  console.error(`check:bundle FAILED\n${problems.join('\n')}`)
  process.exit(1)
}
console.log('check:bundle OK: production bundles are clean; control build contains the panel')
