import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const gitignore = readFileSync('.gitignore', 'utf8').split('\n')

describe('repo hygiene', () => {
  it.each(['.env*.local', '*.pem', 'service-account*.json', 'firebase-debug*.log'])(
    '.gitignore covers %s',
    (line) => {
      expect(gitignore).toContain(line)
    },
  )

  it('tracks no secret-like files', () => {
    const files = execSync('git ls-files', { encoding: 'utf8' }).split('\n').filter(Boolean)
    const bad = files.filter((f) => {
      const name = f.split('/').pop() ?? ''
      return (
        /^\.env.*\.local$/.test(name) ||
        name.endsWith('.pem') ||
        /^service-account.*\.json$/.test(name) ||
        /^firebase-debug.*\.log$/.test(name)
      )
    })
    expect(bad).toEqual([])
  })
})
