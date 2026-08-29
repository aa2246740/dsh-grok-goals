import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'

const require = createRequire(import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  dsh: { client: { inject: string[] } }
}

describe('client package metadata', () => {
  it('exports package.json for the Host client-module scanner', () => {
    expect(() => require.resolve('dsh-grok-goals/package.json')).not.toThrow()
  })

  it('provides a default client export for the Host bundle scanner', () => {
    expect(() => require.resolve('dsh-grok-goals/client')).not.toThrow()
  })

  it('declares the client Connection dependency used by Goal state RPC', () => {
    expect(manifest.dsh.client.inject).toContain('@deepseek-ai/dsh-client-connection')
  })
})
