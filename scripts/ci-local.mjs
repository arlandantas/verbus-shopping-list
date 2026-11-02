// The project's only CI (no GitHub workflows, ADR-0031), for the manager to run before closing a delivery or a
// release round (no git hook). Runs every step, then prints a summary. Run: pnpm ci:local
// Options: --skip-e2e (skip Playwright; say so in the report).
import { spawnSync } from 'node:child_process'

const skipE2e = process.argv.includes('--skip-e2e')
const gitleaks = spawnSync('gitleaks', ['version'], { stdio: 'ignore' }).status === 0

const steps = [
  gitleaks
    ? { name: 'secrets (gitleaks)', cmd: 'gitleaks git --redact --no-banner' }
    : { name: 'secrets (gitleaks)', skip: 'gitleaks not installed; CI still scans the history' },
  { name: 'audit', cmd: 'pnpm audit:ci' },
  { name: 'check', cmd: 'pnpm check' },
  { name: 'bundle', cmd: 'pnpm check:bundle' },
  skipE2e ? { name: 'e2e', skip: '--skip-e2e' } : { name: 'e2e', cmd: 'pnpm test:e2e' },
]

const results = steps.map((s) => {
  if (s.skip) return { name: s.name, status: 'skipped', note: s.skip }
  console.log(`\n=== ${s.name}: ${s.cmd} ===`)
  const ok = spawnSync(s.cmd, { shell: true, stdio: 'inherit' }).status === 0
  return { name: s.name, status: ok ? 'ok' : 'FAILED' }
})

console.log('\n=== ci:local summary ===')
for (const r of results)
  console.log(`${r.status.padEnd(8)} ${r.name}${r.note ? ` (${r.note})` : ''}`)
process.exit(results.some((r) => r.status === 'FAILED') ? 1 : 0)
