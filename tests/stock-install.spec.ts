import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const root = new URL('..', import.meta.url)
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8')) as {
  name: string
  files: string[]
  scripts?: { prepare?: string }
  dsh?: { bundle?: { patch?: string } }
}
const readme = readFileSync(new URL('README.md', root), 'utf8')
const patch = readFileSync(new URL('cordis.patch.yml', root), 'utf8')

describe('stock dsh plugin add can boot this package as a bundle', () => {
  it('declares an official bundle patch that resolves by package name', () => {
    expect(pkg.name).toBe('dsh-grok-goals')
    expect(pkg.dsh?.bundle?.patch).toBe('./cordis.patch.yml')
    expect(existsSync(new URL('cordis.patch.yml', root))).toBe(true)
    expect(patch).toMatch(/id:\s*dsh-grok-goals/)
    expect(patch).toMatch(/name:\s*dsh-grok-goals/)
    expect(patch).not.toMatch(/\.\/src\//)
  })

  it('ships committed lib entries and no prepare script', () => {
    expect(pkg.scripts?.prepare).toBeUndefined()
    expect(existsSync(new URL('lib/dsh-grok-goals.js', root))).toBe(true)
    expect(existsSync(new URL('lib/client.js', root))).toBe(true)
    const client = readFileSync(new URL('lib/client.js', root), 'utf8')
    expect(client).toContain('window.__ModuleLoader__.load')
    expect(client).toContain('"dsh-grok-goals"')
    expect(client).not.toMatch(/\/\/#region \\0dshx-css-module:.*[\\/]/)
    for (const entry of ['lib/*.js', 'lib/*.js.map', 'cordis.patch.yml'] as const) {
      expect(pkg.files, `files must include ${entry}`).toContain(entry)
    }
  })

  it('README leads with the official stock install and does not default to DSHX', () => {
    const heading = readme.indexOf('# dsh-grok-goals')
    const command = readme.indexOf('dsh plugin --profile web add github:aa2246740/dsh-grok-goals')
    const commands = readme.indexOf('## 命令')
    expect(heading).toBeGreaterThanOrEqual(0)
    expect(command).toBeGreaterThan(heading)
    expect(command).toBeLessThan(commands)
    expect(readme).toMatch(/\bpnpm\b/)
    expect(readme).toMatch(/重启这个 Host，再刷新页面/)
    expect(readme).not.toMatch(/\bmy-plugins\b/)
    expect(readme).not.toMatch(/activate-new-client/)
    expect(readme).not.toMatch(/\bdshx\b/i)
    expect(readme).not.toMatch(/DSHX_HARNESS/)
  })
})
