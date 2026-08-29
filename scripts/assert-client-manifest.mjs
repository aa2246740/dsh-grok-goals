#!/usr/bin/env node

const [baseUrl = 'http://127.0.0.1:43128/', expectedId = 'dsh-grok-goals'] = process.argv.slice(2)
const response = await fetch(baseUrl)
if (!response.ok) {
  throw new Error(`Host returned HTTP ${response.status} for ${baseUrl}`)
}
const html = await response.text()
const marker = 'window.__DSH_BOOT__ = '
const start = html.indexOf(marker)
if (start < 0) throw new Error('Host HTML has no window.__DSH_BOOT__ manifest')
const bodyStart = start + marker.length
const end = html.indexOf('</script>', bodyStart)
if (end < 0) throw new Error('Host HTML has an unterminated window.__DSH_BOOT__ manifest')
const boot = JSON.parse(html.slice(bodyStart, end).trim().replace(/;$/, ''))
const entry = Array.isArray(boot.entries)
  ? boot.entries.find(candidate => candidate?.id === expectedId)
  : undefined
if (entry === undefined) {
  throw new Error(`Boot manifest does not contain ${expectedId}`)
}
console.log(JSON.stringify({ id: entry.id, url: entry.url, rev: entry.rev ?? null }))
