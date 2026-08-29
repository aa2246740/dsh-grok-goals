import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-connection'
import { SessionId } from '@deepseek-ai/dsh-session'
import type { GrokGoalStateStore } from './state-store.js'
import {
  GROK_GOAL_RPC_CHANNEL,
  GROK_GOAL_STATE_ENDPOINT,
  parseGrokGoalStateRequest,
} from './wire.js'

export function registerGrokGoalStateRpc(ctx: Context, store: GrokGoalStateStore): void {
  ctx.connection.rpc.handle(
    GROK_GOAL_RPC_CHANNEL,
    async (endpoint, payload) => {
      if (endpoint !== GROK_GOAL_STATE_ENDPOINT) {
        return {
          ok: false,
          error: { code: 'bad-request', message: `Unknown Grok goal endpoint: ${endpoint}`, details: { issues: [] } },
        }
      }
      const request = parseGrokGoalStateRequest(payload)
      if (request === null) {
        return {
          ok: false,
          error: { code: 'bad-request', message: 'Invalid Grok goal state request.', details: { issues: [] } },
        }
      }
      const sessionId = SessionId(request.sessionId)
      const session = ctx.sessions.get(sessionId)
      if (session === undefined) {
        return {
          ok: false,
          error: { code: 'session-not-found', message: `Session ${sessionId} is not active.`, details: { sessionId } },
        }
      }
      return { ok: true, value: { goal: store.get(session) } }
    },
    { authority: 'loopback' },
  )
}
