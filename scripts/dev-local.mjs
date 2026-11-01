// `pnpm dev:local` (S-050): Auth + Firestore emulators, idempotent seed, then Vite (development
// mode => VITE_USE_EMULATOR=true => quick-login panel). Ctrl+C stops everything.
import { spawn, spawnSync } from 'node:child_process'
import net from 'node:net'
import { seedEmulators } from './seed/index.ts'

const AUTH_PORT = 9099
const FIRESTORE_PORT = 8080
const EMULATOR_PORTS = [AUTH_PORT, FIRESTORE_PORT, 4400, 4500, 9150]
const READY_TIMEOUT_MS = 120_000

const log = (msg) => console.log(`[dev:local] ${msg}`)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function portInUse(port) {
  return new Promise((resolve) => {
    const sock = net.connect({ port, host: '127.0.0.1' })
    sock.once('connect', () => (sock.destroy(), resolve(true)))
    sock.once('error', () => resolve(false))
  })
}

async function isEmulatorUp(port, path = '/') {
  try {
    return (await fetch(`http://127.0.0.1:${port}${path}`)).ok
  } catch {
    return false
  }
}

function whoHolds(port) {
  const r = spawnSync('ss', ['-ltnpH', `sport = :${port}`], { encoding: 'utf8' })
  const m = /users:\(\("([^"]+)",pid=(\d+)/.exec(r.stdout ?? '')
  return m ? `${m[1]} (pid ${m[2]})` : 'processo desconhecido'
}

const children = []
let stopping = false

function start(cmd, args) {
  // detached => own process group, so we can stop the whole tree (firebase spawns a JVM)
  const child = spawn(cmd, args, { stdio: 'inherit', detached: true })
  children.push(child)
  child.on('exit', (code) => {
    if (!stopping) {
      log(`${args[0] ?? cmd} encerrou (código ${code}); parando o resto.`)
      void shutdown(code || 1)
    }
  })
  return child
}

function killGroup(child, signal) {
  if (child.exitCode !== null || child.pid === undefined) return
  try {
    process.kill(-child.pid, signal)
  } catch {
    /* already gone */
  }
}

async function shutdown(code = 0) {
  if (stopping) return
  stopping = true
  log('encerrando…')
  for (const c of children.slice().reverse()) killGroup(c, 'SIGINT')
  const deadline = Date.now() + 15_000
  while (Date.now() < deadline && children.some((c) => c.exitCode === null)) await sleep(200)
  for (const c of children) killGroup(c, 'SIGKILL')
  process.exit(code)
}

process.on('SIGINT', () => void shutdown(0))
process.on('SIGTERM', () => void shutdown(0))
process.on('SIGHUP', () => void shutdown(0))

async function main() {
  const busy = []
  for (const p of EMULATOR_PORTS) if (await portInUse(p)) busy.push(p)

  const reuse =
    busy.includes(AUTH_PORT) &&
    busy.includes(FIRESTORE_PORT) &&
    (await isEmulatorUp(FIRESTORE_PORT)) &&
    (await isEmulatorUp(AUTH_PORT))
  if (reuse) {
    log('emuladores já estão rodando; vou reaproveitá-los (a semente é idempotente).')
  } else if (busy.length) {
    console.error('[dev:local] portas ocupadas por outro processo:')
    for (const p of busy) console.error(`  - ${p}: ${whoHolds(p)}`)
    console.error('Feche esses processos (ex.: kill <pid>) e rode `pnpm dev:local` de novo.')
    process.exit(1)
  } else {
    log('subindo emuladores (auth, firestore)…')
    start('pnpm', ['exec', 'firebase', 'emulators:start', '--only', 'auth,firestore'])
    const t0 = Date.now()
    while (!((await isEmulatorUp(FIRESTORE_PORT)) && (await isEmulatorUp(AUTH_PORT)))) {
      if (stopping) return
      if (Date.now() - t0 > READY_TIMEOUT_MS) {
        console.error('[dev:local] emuladores não ficaram prontos a tempo (JDK 21 instalado?).')
        await shutdown(1)
      }
      await sleep(500)
    }
  }

  log('carregando contas e dados de teste…')
  await seedEmulators()
  log('semente pronta. Iniciando o Vite (se a 5173 estiver ocupada, ele usa a próxima porta).')
  start('pnpm', ['exec', 'vite', '--mode', 'development'])
}

main().catch((e) => {
  console.error('[dev:local] falhou:', e instanceof Error ? e.message : e)
  void shutdown(1)
})
