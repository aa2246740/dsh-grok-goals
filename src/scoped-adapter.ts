import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { createUserMessage, HarnessError } from '@deepseek-ai/dsh-llm'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { GenericCallView, ToolRunContext } from '@deepseek-ai/dsh-tools'
import { parseGoalCommand } from './command.js'
import { GrokGoalEngine } from './engine.js'
import { initialGoalDirective } from './prompts.js'
import type { GrokGoalSnapshot } from './types.js'

interface GoalToolValue {
  readonly hostManaged: true
  readonly note: string
  readonly goal: null | {
    readonly id: string
    readonly revision: number
    readonly objective: string
    readonly status: GrokGoalSnapshot['status']
    readonly phase: GrokGoalSnapshot['phase']
    readonly activity: GrokGoalSnapshot['activity']
    readonly tokenBudget: number | null
    readonly tokensUsed: number
    readonly workerRounds: number
    readonly verifierAttempts: number
    readonly verifierAttemptCap: number
    readonly pauseMessage: string | null
    readonly nextStep: string | null
  }
}

const GOAL_VALUE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    hostManaged: { type: 'boolean', required: true },
    note: { type: 'string', required: true },
    goal: {
      required: true,
      oneOf: [
        { type: 'null' },
        {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string', required: true },
            revision: { type: 'integer', required: true },
            objective: { type: 'string', required: true },
            status: { type: 'string', required: true },
            phase: { type: 'string', required: true },
            activity: { type: 'string', required: true },
            tokenBudget: { oneOf: [{ type: 'integer' }, { type: 'null' }], required: true },
            tokensUsed: { type: 'integer', required: true },
            workerRounds: { type: 'integer', required: true },
            verifierAttempts: { type: 'integer', required: true },
            verifierAttemptCap: { type: 'integer', required: true },
            pauseMessage: { oneOf: [{ type: 'string' }, { type: 'null' }], required: true },
            nextStep: { oneOf: [{ type: 'string' }, { type: 'null' }], required: true },
          },
        },
      ],
    },
  },
} as const

const GOAL_OUTPUT = {
  schema: GOAL_VALUE_SCHEMA,
  render: (_args: unknown, value: GoalToolValue) => [{ type: 'text' as const, text: JSON.stringify(value) }],
}

function goalToolValue(engine: GrokGoalEngine, agent: Agent, note: string): GoalToolValue {
  const goal = engine.get(agent)
  if (goal === null) return { hostManaged: true, note, goal: null }
  return {
    hostManaged: true,
    note,
    goal: {
      id: goal.goalId,
      revision: goal.revision,
      objective: goal.objective,
      status: goal.status,
      phase: goal.phase,
      activity: goal.activity,
      tokenBudget: goal.tokenBudget,
      tokensUsed: goal.tokensUsedHighWater,
      workerRounds: goal.totalWorkerRounds,
      verifierAttempts: goal.classifierRunsAttempted,
      verifierAttemptCap: goal.classifierMaxRuns + goal.strategistCapBonus,
      pauseMessage: goal.pauseMessage,
      nextStep: goal.nextStep,
    },
  }
}

function requireRootAgent(agent: Agent | undefined): Agent {
  if (agent === undefined) throw new Error('Grok goal tools require a live agent session.')
  if (agent.session.header.origin === 'subagent') throw new Error('Subagents cannot create or control a root-session goal.')
  return agent
}

function requireDirectHumanToolCall(ctx: Context, exec: ToolRunContext): Agent {
  const agent = requireRootAgent(exec.agent)
  if (ctx.agents.get(agent.id) !== agent
    || agent.status !== 'running'
    || ctx.agents.currentInitiator() !== agent
    || !ctx.agents.roots().includes(agent)) {
    throw new HarnessError(
      'create_goal requires the exact live top-level agent inside its active driver.',
      'GROK_GOAL_DRIVER_REQUIRED',
    )
  }
  const events = agent.session.snapshotEvents()
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index]
    if (event?.type === 'turn/end') {
      throw new HarnessError('create_goal requires an open direct-human turn.', 'GROK_GOAL_DRIVER_REQUIRED')
    }
    if (event?.type === 'turn/start') {
      const hasHumanInput = events.slice(index + 1).some(candidate =>
        candidate.type === 'user/message' && candidate.data.source.kind === 'user')
      if (hasHumanInput) return agent
      break
    }
  }
  throw new HarnessError(
    'create_goal may only run from a direct human message on a top-level agent.',
    'GROK_GOAL_AUTHORITY_REQUIRED',
  )
}

function present(title: string, rawInput?: unknown): GenericCallView {
  return { card: 'generic', title, kind: 'other', ...rawInput === undefined ? {} : { rawInput } }
}

function commandMessage(_summary: string, text: string) {
  return { kind: 'success' as const, text }
}

export function installScopedGoalAdapter(ctx: Context, agent: Agent, engine: GrokGoalEngine): void {
  ctx.systemPrompt.section({
    name: 'tool:goal',
    order: 114,
    text: GrokGoalEngine.promptSectionText(),
  })

  ctx.commands.register({
    name: 'goal',
    description: 'Create and control one host-owned Grok-style autonomous goal.',
    input: {
      hint: '<objective> [--budget <tokens>] | status | pause | resume | clear',
      images: true,
    },
    handler: async (invocation) => {
      try {
        const command = parseGoalCommand(invocation.rawInput)
        if (invocation.attachments.length > 0 && command.kind !== 'create') {
          return { kind: 'error' as const, text: 'Images are accepted only when creating a goal.' }
        }
        switch (command.kind) {
          case 'status': return commandMessage('Grok goal status', engine.statusText(agent))
          case 'pause': {
            const goal = await engine.pause(agent)
            return commandMessage('Grok goal paused', `Paused: ${goal.objective}`)
          }
          case 'resume': {
            const goal = await engine.resume(agent, invocation.signal)
            return commandMessage('Grok goal resumed', `Resumed: ${goal.objective}`)
          }
          case 'clear': {
            await engine.clear(agent)
            return commandMessage('Grok goal cleared', 'The Grok goal was cleared.')
          }
          case 'create': {
            const goal = await engine.create(agent, {
              objective: command.objective,
              tokenBudget: command.tokenBudget,
              attachments: invocation.attachments,
              delivery: 'followup',
            }, invocation.signal)
            return commandMessage(
              goal.status === 'active' ? 'Grok goal started' : 'Grok goal paused',
              engine.statusText(agent),
            )
          }
          default: return commandMessage('Grok goal', 'Unsupported goal command.')
        }
      } catch (error: unknown) {
        return { kind: 'error' as const, text: error instanceof Error ? error.message : String(error) }
      }
    },
  })

  ctx.tools.register(defineTool({
    name: 'get_goal',
    description: 'Read the current host-owned Grok-style goal. The verifier, not the worker model, is the completion authority.',
    parameters: {},
    output: GOAL_OUTPUT,
    execute(_args, exec) {
      const currentAgent = requireRootAgent(exec.agent)
      return Promise.resolve(goalToolValue(engine, currentAgent, 'The host evaluates completion automatically.'))
    },
    presentCall: () => present('Read Grok goal'),
  }))

  ctx.tools.register(defineTool({
    name: 'create_goal',
    description: 'Create one long-running host-owned Grok-style goal for a direct human request. Use token_budget as a token cap, not a round cap. Do not use for routine single-turn work.',
    parameters: {
      objective: { type: 'string', required: true, description: 'Concrete completion objective.' },
      token_budget: { type: 'number', description: 'Optional positive safe-integer token budget.' },
    },
    output: GOAL_OUTPUT,
    async execute(args, exec) {
      const currentAgent = requireDirectHumanToolCall(ctx, exec)
      const goal = await engine.create(currentAgent, {
        objective: args.objective,
        tokenBudget: args.token_budget ?? null,
        delivery: 'none',
      }, exec.signal)
      if (goal.status === 'active' && goal.plan !== null) {
        try {
          exec.deferContext(createUserMessage({
            content: [{ type: 'text', text: initialGoalDirective(goal) }],
            source: {
              kind: 'plugin',
              plugin: 'dsh-grok-goals',
              form: 'instructions',
              summary: 'Grok goal started',
            },
          }))
        } catch (error: unknown) {
          await engine.pauseForInfrastructure(
            currentAgent,
            `Goal context could not be queued: ${error instanceof Error ? error.message : String(error)}`,
          )
          throw error
        }
      }
      return goalToolValue(engine, currentAgent, 'Goal created. The host will evaluate every round and verify completion independently.')
    },
    presentCall: args => present('Create Grok goal', args.objective),
  }))

  ctx.tools.register(defineTool({
    name: 'update_goal',
    description: 'Read-only compatibility shim for a host-owned Grok goal. Model calls cannot edit, pause, resume, clear, complete, or block it; human controls use the /goal command or Goal dock, while the evaluator and verifier own automatic decisions.',
    parameters: {
      goal_id: { type: 'string', description: 'Legacy current-goal id; accepted for compatibility and ignored.' },
      revision: { type: 'number', description: 'Legacy revision fence; accepted for compatibility and ignored.' },
      action: {
        type: 'string',
        enum: ['edit', 'pause', 'resume', 'clear', 'complete', 'blocked'],
        description: 'Requested legacy action. Every model-requested mutation is advisory only.',
      },
      objective: { type: 'string', description: 'Legacy edit objective; ignored.' },
      message: { type: 'string', description: 'Optional advisory note.' },
      blocked_reason: { type: 'string', description: 'Advisory evidence for the hidden evaluator.' },
      completed: { type: 'boolean', description: 'Legacy field; ignored by the host-owned driver.' },
    },
    output: GOAL_OUTPUT,
    execute(_args, exec) {
      const currentAgent = requireRootAgent(exec.agent)
      return Promise.resolve(goalToolValue(
        engine,
        currentAgent,
        'Model-requested goal mutations are advisory only. Use /goal controls for human pause, resume, or clear; the hidden evaluator and verifier decide completion and blocking.',
      ))
    },
    presentCall: args => present('Control Grok goal', args.action ?? args.message),
  }))
}
