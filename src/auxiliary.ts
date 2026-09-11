import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import {
  BlockAssembler,
  createUserMessage,
  lastAssistantStreamChunk,
  type ContentBlock,
  type GenerateOptions,
  type Message,
  type TokenUsage,
} from '@deepseek-ai/dsh-llm'
import type { Session, SessionEvent } from '@deepseek-ai/dsh-session'
import type { ObjectJsonSchema } from '@deepseek-ai/dsh-tools'
import type { SubagentResult, SubagentStopReason } from '@deepseek-ai/dsh-subagent'
import type {} from '@deepseek-ai/dsh-token-meter/client'
import type {} from '@deepseek-ai/dsh-tool-todo/client'

const TRANSCRIPT_TOTAL_CHARS = 32 * 1_024
const TRANSCRIPT_ITEM_CHARS = 4 * 1_024

export interface AuxiliaryTextResult {
  readonly text: string
  readonly tokens: number
}

export class AuxiliaryTextRunError extends Error {
  constructor(message: string, readonly tokens: number) {
    super(message)
    this.name = 'AuxiliaryTextRunError'
  }
}

export function auxiliaryTextErrorTokens(error: unknown): number {
  return error instanceof AuxiliaryTextRunError ? error.tokens : 0
}

export interface StructuredSubagentResult {
  readonly structured: unknown
  readonly outputText: string
  readonly tokens: number
  readonly stopReason: SubagentStopReason
  readonly diagnostic: string | null
}

export class StructuredSubagentRunError extends Error {
  constructor(message: string, readonly tokens: number) {
    super(message)
    this.name = 'StructuredSubagentRunError'
  }
}

export function structuredSubagentErrorTokens(error: unknown): number {
  return error instanceof StructuredSubagentRunError ? error.tokens : 0
}

export function tokenUsageTotal(usage: TokenUsage | undefined): number {
  if (usage === undefined) return 0
  return Math.max(0, usage.inputTokens)
    + Math.max(0, usage.outputTokens)
    + Math.max(0, usage.cacheReadTokens ?? 0)
    + Math.max(0, usage.cacheWriteTokens ?? 0)
}

export function sessionTokenTotal(ctx: Context, session: Session): number {
  const usage = ctx.sessionProjections.snapshot(session).values.tokenUsage
  if (usage === null || usage === undefined) return 0
  return Math.max(0, usage.uncachedInputTokens)
    + Math.max(0, usage.outputTokens)
    + Math.max(0, usage.cacheReadTokens)
    + Math.max(0, usage.cacheWriteTokens)
}

function usageEvent(event: SessionEvent): { readonly turn: number; readonly step: number; readonly usage: TokenUsage } | null {
  if (event.type === 'assistant/message' && event.data.usage !== undefined) {
    return { turn: event.data.turn, step: event.data.step, usage: event.data.usage }
  }
  if (event.type !== 'assistant/message' && event.type !== 'assistant/attempt') return null
  const usage = lastAssistantStreamChunk(event.data.stream, 'usage')?.usage
  return usage === undefined ? null : { turn: event.data.turn, step: event.data.step, usage }
}

export function sessionOwnTokenTotal(session: Session): number {
  let total = 0
  let previousTurn = -1
  let previousStep = -1
  let previousTokens = 0
  for (const event of session.ownEvents()) {
    const sample = usageEvent(event)
    if (sample === null) continue
    const tokens = tokenUsageTotal(sample.usage)
    if (sample.turn === previousTurn && sample.step === previousStep) {
      total += tokens - previousTokens
    } else {
      total += tokens
    }
    previousTurn = sample.turn
    previousStep = sample.step
    previousTokens = tokens
  }
  return Math.max(0, total)
}

function resolveAuxiliaryRoute(agent: Agent): { provider: string; model: string } {
  const latest = agent.session.requestHeader()?.config
  if (latest !== undefined) return { provider: latest.provider, model: latest.model }
  if (agent.options.provider !== undefined
    && agent.options.provider.length > 0
    && agent.options.model !== undefined
    && agent.options.model.length > 0) {
    return { provider: agent.options.provider, model: agent.options.model }
  }
  throw new Error('No provider/model is available for the Grok goal evaluator.')
}

function finishError(assembler: BlockAssembler): Error | null {
  const finish = assembler.finish
  switch (finish.kind) {
    case 'stop': return null
    case 'tool-calls': return new Error('Auxiliary goal model unexpectedly requested a tool.')
    case 'max-tokens': return new Error('Auxiliary goal model reached its output token cap.')
    case 'error':
    case 'aborted': return new Error(finish.failure.message)
    default: return new Error('Auxiliary goal model returned an unknown finish reason.')
  }
}

function textFromBlocks(blocks: readonly ContentBlock[]): string {
  return blocks
    .filter((block): block is Extract<ContentBlock, { type: 'text' }> => block.type === 'text')
    .map(block => block.text)
    .join('')
    .trim()
}

export async function runAuxiliaryText(
  ctx: Context,
  agent: Agent,
  system: string,
  prompt: string,
  signal: AbortSignal | undefined,
  maxTokens: number,
): Promise<AuxiliaryTextResult> {
  const route = resolveAuxiliaryRoute(agent)
  const assembler = new BlockAssembler()
  const messages: Message[] = [createUserMessage({
    content: [{ type: 'text', text: prompt }],
    source: { kind: 'plugin', plugin: 'dsh-grok-goals' },
  })]
  const options: GenerateOptions = {
    provider: route.provider,
    model: route.model,
    messages,
    system,
    tools: [],
    maxTokens,
    ...signal === undefined ? {} : { signal },
  }
  try {
    for await (const chunk of ctx.llm.stream(options)) assembler.push(chunk)
  } catch (error: unknown) {
    throw new AuxiliaryTextRunError(
      error instanceof Error ? error.message : String(error),
      tokenUsageTotal(assembler.usage),
    )
  }
  const tokens = tokenUsageTotal(assembler.usage)
  const error = finishError(assembler)
  if (error !== null) throw new AuxiliaryTextRunError(error.message, tokens)
  const text = textFromBlocks(assembler.blocks())
  if (text.length === 0) throw new AuxiliaryTextRunError('Auxiliary goal model produced no text.', tokens)
  return { text, tokens }
}

function compactBlock(block: ContentBlock): string {
  switch (block.type) {
    case 'text': return block.text
    case 'tool-call': return `[tool call: ${block.name}]`
    case 'tool-result': return `[tool result: ${block.toolCallId}]`
    case 'image': return '[image]'
    default: return `[${block.type}]`
  }
}

function compactMessage(message: Message): string {
  const content = message.content.map(compactBlock).join('\n').trim()
  const bounded = content.length <= TRANSCRIPT_ITEM_CHARS
    ? content
    : `${content.slice(0, TRANSCRIPT_ITEM_CHARS - 1)}…`
  return `${message.role.toUpperCase()}: ${bounded}`
}

export function boundedTranscript(agent: Agent): string {
  const lines = agent.session.deriveMessages().map(compactMessage)
  const kept: string[] = []
  let total = 0
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index] ?? ''
    const next = total + line.length + 2
    if (next > TRANSCRIPT_TOTAL_CHARS && kept.length > 0) break
    kept.unshift(line)
    total = next
  }
  return kept.join('\n\n')
}

export function lastAssistantText(agent: Agent): string {
  const message = agent.session.deriveMessages().findLast(item => item.role === 'assistant')
  return message === undefined ? '' : textFromBlocks(message.content)
}

export function pendingTodoTexts(ctx: Context, agent: Agent): string[] {
  const todos = ctx.sessionProjections.snapshot(agent.session).values.todos ?? []
  return todos
    .filter(todo => todo.status !== 'completed')
    .map(todo => todo.content.trim())
    .filter(Boolean)
}

function providerFor(ctx: Context, candidates: readonly string[]): string {
  const found = candidates.find((candidate) => {
    const provider = ctx.subagents.getProvider(candidate)
    return provider?.capabilities.outputSchema === true
      && provider.capabilities.depthLimit
      && provider.capabilities.toolFilter
  })
  if (found === undefined) {
    throw new Error(`No structured, depth-limited, tool-filtered subagent provider is available (${candidates.join(', ')}).`)
  }
  return found
}

function allowedToolNames(ctx: Context, agent: Agent, desired: readonly string[]): string[] {
  const visible = new Set(ctx.tools.schemas(agent).map(schema => schema.name))
  return desired.filter(name => visible.has(name))
}

function subagentOutputText(result: SubagentResult): string {
  return textFromBlocks(result.output)
}

export async function runStructuredSubagent(
  ctx: Context,
  agent: Agent,
  options: {
    readonly providerCandidates: readonly string[]
    readonly prompt: string
    readonly description: string
    readonly outputSchema: ObjectJsonSchema
    readonly desiredTools: readonly string[]
    readonly signal?: AbortSignal
  },
): Promise<StructuredSubagentResult> {
  const provider = providerFor(ctx, options.providerCandidates)
  const allow = allowedToolNames(ctx, agent, options.desiredTools)
  const run = await ctx.subagents.start(provider, {
    parent: agent,
    prompt: [{ type: 'text', text: options.prompt }],
    label: options.description,
    signal: options.signal ?? new AbortController().signal,
    outputSchema: options.outputSchema,
    maxDepth: 1,
    toolFilter: { allow },
  })
  try {
    let result: SubagentResult
    try {
      result = await run.result
    } catch (error: unknown) {
      const tokens = run.localAgent === undefined ? 0 : sessionOwnTokenTotal(run.localAgent.session)
      throw new StructuredSubagentRunError(
        error instanceof Error ? error.message : String(error),
        tokens,
      )
    }
    const tokens = run.localAgent === undefined ? 0 : sessionOwnTokenTotal(run.localAgent.session)
    return {
      structured: result.structured,
      outputText: subagentOutputText(result),
      tokens,
      stopReason: result.stopReason,
      diagnostic: result.diagnostic ?? null,
    }
  } finally {
    try {
      await run.dispose()
    } catch (error: unknown) {
      ctx.logger.warn(`dsh-grok-goals: auxiliary subagent cleanup failed: ${error instanceof Error ? error.message : String(error)}`)
    }
  }
}
