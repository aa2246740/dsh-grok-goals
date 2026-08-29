import type { GrokGoalProjection } from './types.js'

export const GROK_GOAL_RPC_CHANNEL = '/grok-goals'
export const GROK_GOAL_STATE_ENDPOINT = 'state'

export interface GrokGoalStateRequest {
  readonly sessionId: string
}

export interface GrokGoalStateResponse {
  readonly goal: GrokGoalProjection
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseGrokGoalStateRequest(value: unknown): GrokGoalStateRequest | null {
  if (!isRecord(value) || typeof value['sessionId'] !== 'string' || value['sessionId'].length < 1) return null
  return { sessionId: value['sessionId'] }
}

export function parseGrokGoalStateResponse(value: unknown): GrokGoalStateResponse {
  if (!isRecord(value) || !Object.hasOwn(value, 'goal')) {
    throw new Error('Invalid Grok goal state response.')
  }
  const goal = value['goal']
  if (goal !== null && (!isRecord(goal)
    || typeof goal['goalId'] !== 'string'
    || typeof goal['objective'] !== 'string'
    || typeof goal['status'] !== 'string'
    || typeof goal['revision'] !== 'number')) {
    throw new Error('Invalid Grok goal snapshot response.')
  }
  return { goal: goal as GrokGoalProjection }
}
