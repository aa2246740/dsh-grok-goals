import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const manifest = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')) as {
  exports: Record<string, unknown>
  dsh: { bundle: { patch: string }; client: { inject: string[]; entry: string } }
}

describe('client package metadata', () => {
  it('exports package.json for the Host client-module scanner', () => {
    expect(manifest.exports['./package.json']).toBe('./package.json')
  })

  it('provides a default client export for the Host bundle scanner', () => {
    expect(manifest.dsh.client.entry).toBe('./lib/client.js')
    expect(existsSync(new URL('../lib/client.js', import.meta.url))).toBe(true)
  })

  it('declares the client Connection dependency used by Goal state RPC', () => {
    expect(manifest.dsh.client.inject).toContain('@deepseek-ai/dsh-client-connection')
  })

  it('declares the settings-plugins client for the Plugins settings card', () => {
    expect(manifest.dsh.client.inject).toContain('@deepseek-ai/dsh-client-ui-settings-plugins')
  })
})
