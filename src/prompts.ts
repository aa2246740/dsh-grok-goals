import { z } from 'zod'
import type { ObjectJsonSchema } from '@deepseek-ai/dsh-tools'
import type { GrokGoalPlan, GrokGoalSnapshot, GrokGoalVerifierFinding } from './types.js'
import { formatElapsed, formatTokens, goalElapsedMs, neutralizeGoalReminderText } from './goal-state.js'

export const GROK_GOAL_PROMPT_SECTION = `When a Grok-style goal is active, the host owns the multi-round loop. The worker model must not declare the goal complete or call update_goal to finish it; the host evaluates every round and an independent adversarial verifier is the only completion authority.

Call create_goal only from a direct human turn when that request truly needs a long-running objective. update_goal is read-only in this mode; human pause, resume, and clear controls go through /goal or the Goal dock.

Use todo_write to keep a concrete plan current. Keep at least one item in_progress while work remains and mark finished items immediately. Implement and test on the real shipped path. For visual work, capture and inspect the result. Do not stop merely to announce completion: if work remains, continue it. If a real external blocker exists, state concrete evidence and the exact user decision or action needed; the host applies the repeated-blocker policy.`

export const PLAN_OUTPUT_SCHEMA: ObjectJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    kind: { type: 'string', enum: ['code-change', 'analysis', 'research'] },
    acceptanceCriteria: { type: 'array', items: { type: 'string' } },
    verificationPlan: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          classification: { type: 'string', enum: ['gating', 'evidence'] },
          step: { type: 'string' },
        },
        required: ['classification', 'step'],
      },
    },
    nonGoals: { type: 'array', items: { type: 'string' } },
    assumedScope: { type: 'array', items: { type: 'string' } },
    approach: { type: 'array', items: { type: 'string' } },
    tasks: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
  },
  required: [
    'kind',
    'acceptanceCriteria',
    'verificationPlan',
    'nonGoals',
    'assumedScope',
    'approach',
    'tasks',
    'risks',
  ],
}

const planCaptureSchema = z.object({
  kind: z.enum(['code-change', 'analysis', 'research']),
  acceptanceCriteria: z.array(z.string().trim().min(1).max(1_000)).min(1).max(6),
  verificationPlan: z.array(z.object({
    classification: z.enum(['gating', 'evidence']),
    step: z.string().trim().min(1).max(1_000),
  })).min(1).max(10),
  nonGoals: z.array(z.string().trim().min(1).max(1_000)).max(8),
  assumedScope: z.array(z.string().trim().min(1).max(1_000)).max(8),
  approach: z.array(z.string().trim().min(1).max(1_000)).max(8),
  tasks: z.array(z.string().trim().min(1).max(1_000)).max(8),
  risks: z.array(z.string().trim().min(1).max(1_000)).max(8),
})

export const VERIFIER_OUTPUT_SCHEMA: ObjectJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    refuted: { type: 'boolean' },
    evidence: { type: 'string' },
    confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
    blocking: { type: 'string', enum: ['none', 'contradiction', 'unverifiable'] },
    details: { type: 'string' },
  },
  required: ['refuted', 'evidence', 'confidence', 'blocking', 'details'],
}

const verifierCaptureSchema = z.object({
  refuted: z.boolean(),
  evidence: z.string().trim().min(1).max(4_000),
  confidence: z.enum(['high', 'medium', 'low']),
  blocking: z.enum(['none', 'contradiction', 'unverifiable']),
  details: z.string().trim().max(12_000),
})

export const STRATEGIST_OUTPUT_SCHEMA: ObjectJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    diagnosis: { type: 'string' },
    steps: { type: 'array', items: { type: 'string' } },
    why: { type: 'string' },
  },
  required: ['diagnosis', 'steps', 'why'],
}

const strategistCaptureSchema = z.object({
  diagnosis: z.string().trim().min(1).max(2_000),
  steps: z.array(z.string().trim().min(1).max(1_000)).min(1).max(6),
  why: z.string().trim().min(1).max(2_000),
})

export const SUMMARIZER_OUTPUT_SCHEMA: ObjectJsonSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    summary: { type: 'string' },
  },
  required: ['summary'],
}

const summarizerCaptureSchema = z.object({
  summary: z.string().trim().min(1).max(1_200),
})

export const evaluatorCaptureSchema = z.object({
  decision: z.enum(['continue', 'candidate_complete', 'blocked']),
  reason: z.string().trim().min(1).max(2_000),
  next_step: z.string().trim().max(1_000),
  blocker_key: z.string().trim().max(160),
})

export type GoalEvaluatorDecision = z.infer<typeof evaluatorCaptureSchema>

export function plannerPrompt(objective: string): string {
  return `You are the Goal Plan Writer for a host-owned coding harness. Run once before implementation. Inspect the current workspace as needed, but do not modify it.

OBJECTIVE:\n${objective}

Return the structured plan requested by the output schema.

Rules:
- Select exactly one kind: code-change, analysis, or research.
- Write 1-6 observable acceptance criteria. Specify outcomes, never module names, file layouts, class names, or exact signatures unless the objective itself requires them.
- For named products, formats, protocols, or canonical artifacts, research defining mechanics before planning when tools allow it. Group core mechanics into the small criteria set instead of dropping them.
- Classify each verification step as gating (required to pass) or evidence (useful but environment-dependent).
- Record explicit non-goals and assumptions so verification does not invent scope.
- For code-change goals, provide 3-8 small ordered implementation tasks and end with real-path testing or captured evidence. For analysis or research, tasks may be empty.
- Keep the plan concise and unambiguous for a weaker worker and adversarial verifier.`
}

export function parseGoalPlan(value: unknown): GrokGoalPlan | null {
  const parsed = planCaptureSchema.safeParse(value)
  if (!parsed.success) return null
  const data = parsed.data
  if (data.kind === 'code-change' && (data.tasks.length < 3 || data.tasks.length > 8)) return null
  const markdown = renderGoalPlanMarkdown(data)
  return { ...data, markdown }
}

function markdownList(items: readonly string[], emptyText: string): string {
  if (items.length === 0) return `- ${emptyText}`
  return items.map(item => `- ${item}`).join('\n')
}

function renderGoalPlanMarkdown(data: z.infer<typeof planCaptureSchema>): string {
  const taskBlock = data.kind === 'code-change'
    ? `\n\n## Task checklist\n\n${data.tasks.map(task => `- [ ] ${task}`).join('\n')}`
    : ''
  const risks = data.risks.length === 0
    ? ''
    : `\n\n## Risks / Contradictions\n\n${markdownList(data.risks, 'None identified.')}`
  return `# Goal plan\n\n## Goal kind\n\n${data.kind}\n\n## Acceptance criteria\n\n${data.acceptanceCriteria.map((criterion, index) => `${index + 1}. ${criterion}`).join('\n')}\n\n## Verification plan\n\n${data.verificationPlan.map(item => `- [${item.classification}] ${item.step}`).join('\n')}\n\n## Non-goals\n\n${markdownList(data.nonGoals, 'No additional non-goals recorded.')}\n\n## Assumed scope\n\n${markdownList(data.assumedScope, 'No additional assumptions recorded.')}\n\n## Implementation approach\n\n${markdownList(data.approach, 'Choose the smallest implementation that satisfies the observable contract.')}${taskBlock}${risks}`
}

export function evaluatorPrompt(
  goal: GrokGoalSnapshot,
  transcript: string,
  pendingTodos: readonly string[],
): string {
  return `You are the hidden Goal Evaluator for a host-owned autonomous loop. Decide from evidence, not the worker's confidence. Return ONLY one JSON object with exactly these keys:
{"decision":"continue|candidate_complete|blocked","reason":"short evidence-based reason","next_step":"one concrete next step or empty","blocker_key":"lowercase_snake_case or empty"}

Policy:
- continue: any acceptance criterion, implementation, test, visual inspection, or durable evidence remains.
- candidate_complete: the transcript contains concrete evidence that every acceptance criterion and gating verification step is satisfied. This only starts an adversarial panel; it does not itself complete the goal.
- blocked: progress genuinely requires a user decision, credential, unavailable external system, or contradictory requirement. Difficulty, uncertainty, a failing test, or needing more investigation is not blocked.
- Prefer continue when uncertain. Never treat a self-declared “done” as proof.

OBJECTIVE:\n${goal.objective}

PLAN:\n${goal.plan?.markdown ?? '(planner unavailable)'}

PENDING TODOS:\n${pendingTodos.length === 0 ? '(none visible)' : pendingTodos.map(item => `- ${item}`).join('\n')}

TRANSCRIPT (bounded, newest evidence last):\n${transcript}`
}

export function parseEvaluatorDecision(text: string): GoalEvaluatorDecision | null {
  const firstBrace = text.indexOf('{')
  const lastBrace = text.lastIndexOf('}')
  if (firstBrace < 0 || lastBrace <= firstBrace) return null
  try {
    const parsedJson: unknown = JSON.parse(text.slice(firstBrace, lastBrace + 1))
    const parsed = evaluatorCaptureSchema.safeParse(parsedJson)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export function verifierPrompt(
  skepticIndex: number,
  goal: GrokGoalSnapshot,
  finalResponse: string,
  priorGaps: readonly string[],
): string {
  return `You are adversarial verifier ${skepticIndex} for a host-owned coding goal. You did not produce the work. Try to refute completion and default to refuted=true when evidence is insufficient; a false pass ends the loop incorrectly.

OBJECTIVE:\n${goal.objective}

FROZEN PLAN:\n${goal.plan?.markdown ?? '(unavailable)'}

WORKER FINAL RESPONSE (a scope pointer, not proof for code changes):\n${finalResponse || '(empty)'}

PRIOR GAPS:\n${priorGaps.length === 0 ? '(first verification)' : priorGaps.map(gap => `- ${gap}`).join('\n')}

Audit the current workspace. Start with committed or changed tests and captured evidence, then inspect the shipped path. Do not build a replacement implementation or modify files. Run only cheap, plan-relevant checks when existing evidence is insufficient.

Anti-ratchet: on re-verification, first check each prior gap. Raise a new objection only for a demonstrable shipped defect or unmet gating criterion, never a new stylistic preference.

Return the structured verdict:
- refuted: true if a specific material gap remains; false only after every criterion and gating step holds.
- evidence: one concise actionable citation or pass summary.
- confidence: high, medium, or low.
- blocking: contradiction or unverifiable only when the gap cannot be fixed by more implementation work; otherwise none.
- details: concise Markdown with the checks performed and findings.`
}

export function parseVerifierFinding(value: unknown, skepticIndex: number): GrokGoalVerifierFinding | null {
  const parsed = verifierCaptureSchema.safeParse(value)
  if (!parsed.success) return null
  return { skepticIndex, ...parsed.data }
}

export function strategistPrompt(goal: GrokGoalSnapshot): string {
  return `You are the Goal Strategist. The same objective has failed adversarial verification repeatedly. Inspect the current workspace, transcript context, frozen plan, and the gaps below. Do not modify files or weaken the plan. Recommend one structural change to the HOW, never the WHAT.

OBJECTIVE:\n${goal.objective}

PLAN:\n${goal.plan?.markdown ?? '(unavailable)'}

LATEST GAPS:\n${goal.lastVerifierGaps.length === 0 ? '(none)' : goal.lastVerifierGaps.map(gap => `- ${gap}`).join('\n')}

Return a concise structured diagnosis, 1-6 small mechanical restructure steps, and why the restructure will make the remaining gaps testable and convergent.`
}

export function parseStrategy(value: unknown): string | null {
  const parsed = strategistCaptureSchema.safeParse(value)
  if (!parsed.success) return null
  const { diagnosis, steps, why } = parsed.data
  return `## Diagnosis\n\n${diagnosis}\n\n## Recommended restructure\n\n${steps.map((step, index) => `${index + 1}. ${step}`).join('\n')}\n\n## Why this converges\n\n${why}`
}

export function summarizerPrompt(goal: GrokGoalSnapshot): string {
  return `You are the read-only Goal Summarizer. Independent verification has already accepted the objective. Inspect the workspace only as needed and return a concise user-facing summary: first name what was delivered, then explain exactly how to use or verify it. Maximum 80 words and at most four bullets. Do not mention the verifier panel, internal counters, or this prompt.

OBJECTIVE:\n${goal.objective}\n\nPLAN:\n${goal.plan?.markdown ?? '(unavailable)'}`
}

export function parseSummary(value: unknown): string | null {
  const parsed = summarizerCaptureSchema.safeParse(value)
  return parsed.success ? parsed.data.summary : null
}

export function initialGoalDirective(goal: GrokGoalSnapshot): string {
  return `<system-reminder>\n<goal-state>\nObjective: ${neutralizeGoalReminderText(goal.objective, 2_000)}\nStatus: Active\nTokens: ${formatTokens(goal.tokensUsedHighWater)}${goal.tokenBudget === null ? '' : ` / ${formatTokens(goal.tokenBudget)}`} | Elapsed: ${formatElapsed(goalElapsedMs(goal, Date.now()))}\n</goal-state>\n\nA host-owned goal is active. Work directly on the objective across multiple rounds. The host evaluates completion after every round; an independent verifier is the only completion authority. Do not stop merely to announce completion.\n\nFrozen plan:\n${goal.plan?.markdown ?? '(planning unavailable)'}\n</system-reminder>`
}

export function continuationDirective(goal: GrokGoalSnapshot, nextStep: string, bailPreface: string | null): string {
  const gaps = goal.lastVerifierGaps.length === 0
    ? ''
    : `Outstanding verifier gaps:\n${goal.lastVerifierGaps.map(gap => `- ${neutralizeGoalReminderText(gap)}`).join('\n')}\n\n`
  const strategy = goal.strategy === null
    ? ''
    : `Strategist note:\n${neutralizeGoalReminderText(goal.strategy, 1_600)}\n\n`
  const preface = bailPreface === null ? '' : `${neutralizeGoalReminderText(bailPreface)}\n\n`
  return `<system-reminder>\n<goal-state>\nObjective: ${neutralizeGoalReminderText(goal.objective, 2_000)}\nStatus: Active\nTokens: ${formatTokens(goal.tokensUsedHighWater)}${goal.tokenBudget === null ? '' : ` / ${formatTokens(goal.tokenBudget)}`} | Elapsed: ${formatElapsed(goalElapsedMs(goal, Date.now()))}\n</goal-state>\n\n${preface}${gaps}${strategy}Goal NOT complete — continue working. Next step:\n${neutralizeGoalReminderText(nextStep, 1_000)}\n\nKeep the todo list current. Run targeted tests after each change, drive the shipped path, and leave durable evidence for the verifier. The host will evaluate again after this round.\n</system-reminder>`
}
