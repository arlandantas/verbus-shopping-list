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

describe('S-060 AC4: viewport meta', () => {
  it('S-102 AC1: index.html declares color-scheme and a themed html background', () => {
    const html = readFileSync(join(root, 'index.html'), 'utf8')
    expect(html).toContain('<meta name="color-scheme" content="light dark" />')
    expect(html).toMatch(/html \{\s*background-color: #f6fbf6/)
    expect(html).toMatch(/dark\) \{\s*html \{\s*background-color: #0f1511/)
  })

  it('S-060 AC4: index.html resizes content with the keyboard', () => {
    expect(readFileSync(join(root, 'index.html'), 'utf8')).toContain(
      'content="width=device-width, initial-scale=1, interactive-widget=resizes-content"',
    )
  })
})

describe('S-070 AC2: no fixed Tailwind palette colors in src', () => {
  // Justified exceptions: none yet. Add "path:line-fragment" entries with a reason.
  const exceptions: string[] = []
  const palette =
    /\b(text|bg|border|ring|fill|stroke|divide|outline)-(gray|green|red|blue|slate|zinc|neutral|white|black)\b/
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)],
    )
  it('S-070 AC2: src/**/*.{ts,tsx,css} use theme tokens only', () => {
    const hits = walk(join(root, 'src'))
      .filter((f) => /\.(ts|tsx|css)$/.test(f) && !/\.test\.tsx?$/.test(f))
      .flatMap((f) =>
        readFileSync(f, 'utf8')
          .split('\n')
          .map((l, n) => `${f.slice(root.length + 1)}:${n + 1}: ${l.trim()}`)
          .filter((l) => palette.test(l) && !exceptions.some((x) => l.includes(x))),
      )
    expect(hits).toEqual([])
  })
})
