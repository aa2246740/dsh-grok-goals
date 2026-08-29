import type { ClientContext, SessionId } from '@deepseek-ai/dsh-client-runtime/client'
import type {} from '@deepseek-ai/dsh-api-remotes/client'
import type { ConnectionHandle } from '@deepseek-ai/dsh-client-connection/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-tool-todo/client'
import type {} from '../types.js'
import {
  GROK_GOAL_RPC_CHANNEL,
  GROK_GOAL_STATE_ENDPOINT,
  parseGrokGoalStateResponse,
} from '../wire.js'
import { GrokGoalDock, type GrokGoalDockInjected } from './GrokGoalDock.js'
import { en, zh, type GrokGoalKey } from './locales.js'

export { GrokGoalDock } from './GrokGoalDock.js'
export type { GrokGoalDockInjected } from './GrokGoalDock.js'

const NS = 'grokGoal'

export const inject = ['connection', 'slots', 'remote', 'remote.commands', 'locale']

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    grokGoal: GrokGoalKey
  }
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'dsh-grok-goals: dictionaries')

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'goal',
    order: 10,
    priority: -100,
    locale: NS,
    inject: (sessionId: SessionId): GrokGoalDockInjected => ({
      locale: ctx.locale.getLocale().active,
      sessionId,
      loadGoal: async () => {
        const connection = ctx.get('connection') as ConnectionHandle | undefined
        if (connection === undefined) throw new Error('Grok goal state connection is unavailable.')
        const result = await connection.rpc.call(
          GROK_GOAL_RPC_CHANNEL,
          GROK_GOAL_STATE_ENDPOINT,
          { sessionId },
        )
        if (!result.ok) throw new Error(`${result.error.message} (${result.error.code})`)
        return parseGrokGoalStateResponse(result.value).goal
      },
      runGoalCommand: async (line) => {
        try {
          const result = await ctx.remote.commands.execute(sessionId, line, [])
          if (!result.ok) return `${result.error.message} (${result.error.code})`
          if (result.value === undefined) return `Unknown goal command: ${line}`
          if (result.value.result.kind === 'error') return result.value.result.text
          return null
        } catch (error: unknown) {
          return error instanceof Error ? error.message : String(error)
        }
      },
    }),
  }, GrokGoalDock))
}
