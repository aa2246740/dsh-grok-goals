import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import type {} from '@deepseek-ai/dsh-commands'
import type {} from '@deepseek-ai/dsh-client-connection'
import type {} from '@deepseek-ai/dsh-host-webserver'
import type {} from '@deepseek-ai/dsh-goal'
import type {} from '@deepseek-ai/dsh-llm'
import type {} from '@deepseek-ai/dsh-session'
import type {} from '@deepseek-ai/dsh-session-projection'
import type {} from '@deepseek-ai/dsh-settings'
import type {} from '@deepseek-ai/dsh-storage-domain'
import type {} from '@deepseek-ai/dsh-subagent'
import type {} from '@deepseek-ai/dsh-system-prompt'
import type {} from '@deepseek-ai/dsh-tools'
import type {} from '@deepseek-ai/dsh-token-meter/client'
import {
  Config,
  GROK_GOAL_SETTINGS_NAMESPACE,
  resolveConfig,
  type Config as GrokGoalConfig,
} from './config.js'
import { GrokGoalEngine } from './engine.js'
import { installScopedGoalAdapter } from './scoped-adapter.js'
import { registerGrokGoalStateRpc } from './state-rpc.js'
import { GrokGoalStateStore } from './state-store.js'

export const name = 'dsh-grok-goals'
export const inject = [
  'agents',
  'commands',
  'connection',
  'goals',
  'llm',
  'sessions',
  'sessionProjections',
  'storageDomain',
  'subagents',
  'systemPrompt',
  'tools',
  'webServer',
]

export { Config, GROK_GOAL_SETTINGS_NAMESPACE } from './config.js'

function isRootAgent(agent: Agent): boolean {
  return agent.session.header.origin !== 'subagent'
}

export async function apply(ctx: Context, config: GrokGoalConfig = {}): Promise<void> {
  let source: () => GrokGoalConfig = () => config
  ctx.inject(['settings'], (settingsCtx) => {
    settingsCtx.settings.installSection(ctx, GROK_GOAL_SETTINGS_NAMESPACE, Config, config, {
      setSource: current => { source = current },
      onChange: () => {},
    })
  })

  const resolved = resolveConfig(source())
  if (!resolved.enabled) {
    ctx.logger.info('[my-plugins/dsh-grok-goals] disabled')
    return
  }

  const store = await GrokGoalStateStore.open(ctx)
  ctx.effect(() => () => store.close(), 'dsh-grok-goals: state store')
  registerGrokGoalStateRpc(ctx, store)
  const engine = new GrokGoalEngine(ctx, () => resolveConfig(source()), store)
  const fibers = new Map<Agent, ReturnType<Context['inject']>>()
  const disposalTasks = new Set<Promise<void>>()

  const install = (agent: Agent): void => {
    if (!isRootAgent(agent) || fibers.has(agent)) return
    try {
      ctx.goals.disarm(agent)
    } catch (error: unknown) {
      ctx.logger.warn(`dsh-grok-goals: could not disarm the native goal driver: ${error instanceof Error ? error.message : String(error)}`)
    }
    const fiber = agent.ctx.inject(['agents', 'commands', 'systemPrompt', 'tools'], (scope) => {
      installScopedGoalAdapter(scope, agent, engine)
    })
    fibers.set(agent, fiber)
    void engine.restartSafetyPause(agent).catch((error: unknown) => {
      ctx.logger.error(`dsh-grok-goals: restart safety pause failed: ${error instanceof Error ? error.message : String(error)}`)
    })
  }

  const dispose = (agent: Agent): void => {
    engine.disposeAgent(agent)
    const fiber = fibers.get(agent)
    if (fiber === undefined) return
    fibers.delete(agent)
    const task = fiber.dispose().catch((error: unknown) => {
      ctx.logger.warn(`dsh-grok-goals: scoped adapter cleanup failed: ${error instanceof Error ? error.message : String(error)}`)
    })
    disposalTasks.add(task)
    void task.finally(() => { disposalTasks.delete(task) })
  }

  for (const agent of ctx.agents.list()) install(agent)
  ctx.on('agent/created', ({ agent }) => { install(agent) })
  ctx.on('agent/disposed', ({ agent }) => { dispose(agent) })
  ctx.on('agent/error', ({ agent, error }) => {
    if (!isRootAgent(agent) || engine.get(agent)?.status !== 'active') return
    void engine.pauseForInfrastructure(
      agent,
      `The worker turn failed or was aborted: ${error instanceof Error ? error.message : String(error)}`,
    ).catch((pauseError: unknown) => {
      ctx.logger.error(`dsh-grok-goals: error-turn pause failed: ${pauseError instanceof Error ? pauseError.message : String(pauseError)}`)
    })
  })
  ctx.on('agent/turn-stopping', async ({ agent, signal }) => {
    if (!isRootAgent(agent)) return
    try {
      await engine.onTurnStopping(agent, signal)
    } catch (error: unknown) {
      ctx.logger.error(`dsh-grok-goals: turn-end orchestration failed: ${error instanceof Error ? error.message : String(error)}`)
      const goal = engine.get(agent)
      if (goal?.status === 'active') {
        try {
          await engine.pauseForInfrastructure(agent, `Host orchestration failed: ${error instanceof Error ? error.message : String(error)}`)
        } catch (pauseError: unknown) {
          ctx.logger.error(`dsh-grok-goals: emergency pause failed: ${pauseError instanceof Error ? pauseError.message : String(pauseError)}`)
        }
      }
    }
  })

  ctx.effect(() => async () => {
    engine.shutdown()
    const remaining = [...fibers.values()]
    fibers.clear()
    await Promise.all([
      ...remaining.map(fiber => fiber.dispose()),
      ...disposalTasks,
    ])
  }, 'dsh-grok-goals: agent-scoped adapters')

  ctx.logger.info('[my-plugins/dsh-grok-goals] loaded')
}
