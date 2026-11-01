// @vitest-environment node
import { mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { build } from 'vite'
import { TEST_ACCOUNTS } from '../scripts/seed/accounts.ts'
import { devStrings } from '../src/strings/pt-BR'

function allFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f)
    return statSync(p).isDirectory() ? allFiles(p) : [p]
  })
}

async function bundleText(mode: string): Promise<string> {
  const outDir = mkdtempSync(join(tmpdir(), 'verbus-bundle-'))
  try {
    await build({ mode, logLevel: 'silent', build: { outDir, emptyOutDir: true } })
    return allFiles(outDir)
      .filter((f) => /\.(js|html|css|webmanifest)$/.test(f))
      .map((f) => readFileSync(f, 'utf8'))
      .join('\n')
  } finally {
    rmSync(outDir, { recursive: true, force: true })
  }
}

describe('S-050 AC5: quick-login panel stays out of production', () => {
  it('S-050 AC5: development (emulator) build contains the panel and accounts (sanity)', async () => {
    const text = await bundleText('development')
    expect(text).toContain(devStrings.testAccounts)
    expect(text).toContain(TEST_ACCOUNTS[0].password)
  }, 180_000)

  it('S-050 AC5: production build has neither the panel nor the fake credentials', async () => {
    const text = await bundleText('production')
    expect(text).not.toContain(devStrings.testAccounts)
    expect(text).not.toContain(devStrings.emulatorNotFound)
    for (const a of TEST_ACCOUNTS) {
      expect(text).not.toContain(a.password)
      expect(text).not.toContain(a.email)
    }
  }, 180_000)
})
