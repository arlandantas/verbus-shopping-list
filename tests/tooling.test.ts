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
