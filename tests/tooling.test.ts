// @vitest-environment node
import { execSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

describe('S-002 AC3: firebase imports restricted', () => {
  const code = "import { getFirestore } from 'firebase/firestore'\nexport const x = getFirestore\n"
  it.each(['src/screens/List/List.tsx', 'src/components/Button.tsx'])(
    'S-002 AC3: errors in %s',
    async (filePath) => {
      const eslint = new ESLint({ cwd: root })
      const [result] = await eslint.lintText(code, { filePath: join(root, filePath) })
      const errors = result.messages.filter((m) => m.ruleId === 'no-restricted-imports')
      expect(errors).toHaveLength(1)
    },
  )
  it('S-002 AC3: allowed in src/data', async () => {
    const eslint = new ESLint({ cwd: root })
    const [result] = await eslint.lintText(code, { filePath: join(root, 'src/data/firebase.ts') })
    expect(result.messages.filter((m) => m.ruleId === 'no-restricted-imports')).toHaveLength(0)
  })
})

describe('S-002 AC4: tailwind build', () => {
  it('S-002 AC4: build emits utility class used in App.tsx', () => {
    execSync('pnpm build', { cwd: root, stdio: 'pipe' })
    const assets = join(root, 'dist/assets')
    const css = readdirSync(assets)
      .filter((f) => f.endsWith('.css'))
      .map((f) => readFileSync(join(assets, f), 'utf8'))
      .join('')
    expect(css).toContain('min-h-12')
  }, 120_000)
})

describe('S-050 AC1: dev:local is wired and documented', () => {
  const read = (f: string) => readFileSync(join(root, f), 'utf8')
  it('S-050 AC1: package.json script runs scripts/dev-local.mjs', () => {
    const scripts = JSON.parse(read('package.json')).scripts as Record<string, string>
    expect(scripts['dev:local']).toContain('scripts/dev-local.mjs')
  })
  it('S-050 AC1: dev-local starts auth+firestore emulators, seeds, then vite', () => {
    const src = read('scripts/dev-local.mjs')
    expect(src).toContain('auth,firestore')
    expect(src.indexOf('seedEmulators()')).toBeLessThan(src.indexOf("'vite'"))
  })
  it('S-050 AC1: README explains it in at most 5 lines; AGENTS.md Commands lists it', () => {
    const readme = read('README.md')
    const section = readme.split(/^## /m).find((s) => s.startsWith('Teste manual local'))
    expect(section).toBeDefined()
    expect(section!.trim().split('\n').length - 1).toBeLessThanOrEqual(5)
    expect(section).toContain('pnpm dev:local')
    expect(read('AGENTS.md')).toContain('`pnpm dev:local`')
  })
})
