import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GrokGoalStateStore } from '../src/state-store.js'
import {
  GROK_GOAL_RPC_CHANNEL,
  GROK_GOAL_STATE_ENDPOINT,
  parseGrokGoalStateRequest,
  parseGrokGoalStateResponse,
} from '../src/wire.js'

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), 'utf8')
}

describe('RC8 persistence compatibility', () => {
  it('constructs the Storage Domain module with an RC8-valid domain name', () => {
    expect(GrokGoalStateStore).toBeTypeOf('function')
  })

  it('keeps downstream Goal events out of the canonical Session log', () => {
    expect(source('../src/engine.ts')).not.toContain("session.append('grok-goal/change'")
    expect(source('../src/types.ts')).not.toContain("'grok-goal/change':")
  })

  it('uses a dedicated Connection RPC channel with strict request and response payloads', () => {
    expect(GROK_GOAL_RPC_CHANNEL).toBe('/grok-goals')
    expect(GROK_GOAL_STATE_ENDPOINT).toBe('state')
    expect(parseGrokGoalStateRequest({ sessionId: 'session-test' })).toEqual({ sessionId: 'session-test' })
    expect(parseGrokGoalStateRequest({ sessionId: '' })).toBeNull()
    expect(parseGrokGoalStateResponse({ goal: null })).toEqual({ goal: null })
    expect(() => parseGrokGoalStateResponse({})).toThrow('Invalid Grok goal state response')
  })
})
