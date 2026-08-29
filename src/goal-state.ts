import { randomBytes, randomUUID } from 'node:crypto'
import type {
  GrokGoalActivity,
  GrokGoalHistoryType,
  GrokGoalPlan,
  GrokGoalSnapshot,
  GrokGoalStatus,
  GrokGoalVerifierFinding,
} from './types.js'

export const GOAL_HISTORY_LIMIT = 64
export const GOAL_CLASSIFIER_STALL_THRESHOLD = 2
export const GOAL_STRATEGIST_CAP_BONUS = 3
export const GOAL_STRATEGIST_STALL_THRESHOLD = 5
export const GOAL_BLOCKER_STREAK_THRESHOLD = 3

const PAUSED_STATUSES = new Set<GrokGoalStatus>([
  'user_paused',
  'back_off_paused',
  'no_progress_paused',
  'infra_paused',
  'blocked',
])

const TERMINAL_STATUSES = new Set<GrokGoalStatus>(['budget_limited', 'complete'])

export interface CreateGoalSnapshotOptions {
  readonly objective: string
  readonly tokenBudget: number | null
  readonly tokenBaseline: number
  readonly classifierMaxRuns: number
  readonly now: number
}

export interface GoalTokenUpdate {
  readonly tokenBaseline: number
  readonly parentTokensSpent: number
  readonly auxiliaryTokensSpent: number
  readonly lastSessionTokensSeen: number
  readonly tokensUsedHighWater: number
}

export class GoalTransitionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GoalTransitionError'
  }
}

export function isPausedGoalStatus(status: GrokGoalStatus): boolean {
  return PAUSED_STATUSES.has(status)
}

export function isTerminalGoalStatus(status: GrokGoalStatus): boolean {
  return TERMINAL_STATUSES.has(status)
}

export function isGoalRunning(goal: GrokGoalSnapshot | null): goal is GrokGoalSnapshot {
  return goal?.status === 'active'
}

export function createGoalSnapshot(options: CreateGoalSnapshotOptions): GrokGoalSnapshot {
  const { objective, tokenBudget, tokenBaseline, classifierMaxRuns, now } = options
  const trimmedObjective = objective.trim()
  if (trimmedObjective.length === 0) throw new GoalTransitionError('Goal objective cannot be empty.')
  if (tokenBudget !== null && (!Number.isSafeInteger(tokenBudget) || tokenBudget <= 0)) {
    throw new GoalTransitionError('Token budget must be a positive safe integer.')
  }
  if (!Number.isSafeInteger(classifierMaxRuns) || classifierMaxRuns <= 0) {
    throw new GoalTransitionError('Classifier run cap must be a positive safe integer.')
  }

  return {
    schemaVersion: 1,
    goalId: randomUUID(),
    verifierId: randomBytes(6).toString('hex'),
    objective: trimmedObjective,
    status: 'active',
    phase: 'planning',
    activity: 'planning',
    tokenBudget,
    tokenBaseline,
    parentTokensSpent: 0,
    auxiliaryTokensSpent: 0,
    lastSessionTokensSeen: tokenBaseline,
    tokensUsedHighWater: 0,
    elapsedMs: 0,
    activeSince: now,
    totalWorkerRounds: 0,
    totalVerifyRounds: 0,
    classifierRunsAttempted: 0,
    classifierMaxRuns,
    consecutiveNotAchieved: 0,
    lastStrategistFiredAt: 0,
    strategistCapBonus: 0,
    roundsSinceVerify: 0,
    lastVerifierVerdict: null,
    lastVerifierGaps: [],
    lastGapFingerprint: null,
    classifierStallCount: 0,
    lastVerification: null,
    evaluatorBlockerKey: null,
    evaluatorBlockedStreak: 0,
    plan: null,
    strategy: null,
    nextStep: null,
    pauseMessage: null,
    completionSummary: null,
    firstFinalResponse: null,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    history: [{ type: 'created', at: now, detail: trimmedObjective }],
  }
}

export function goalElapsedMs(goal: GrokGoalSnapshot, now: number): number {
  if (goal.activeSince === null) return goal.elapsedMs
  return goal.elapsedMs + Math.max(0, now - goal.activeSince)
}

export function refreshGoalTokens(
  goal: GrokGoalSnapshot,
  currentSessionTokens: number,
  auxiliaryIncrement = 0,
): GoalTokenUpdate {
  const normalizedCurrent = Math.max(0, Math.trunc(currentSessionTokens))
  const normalizedAuxiliary = Math.max(0, Math.trunc(auxiliaryIncrement))
  const parentDelta = Math.max(0, normalizedCurrent - goal.lastSessionTokensSeen)
  const parentTokensSpent = goal.parentTokensSpent + parentDelta
  const auxiliaryTokensSpent = goal.auxiliaryTokensSpent + normalizedAuxiliary
  const observedTotal = parentTokensSpent + auxiliaryTokensSpent
  return {
    tokenBaseline: goal.tokenBaseline,
    parentTokensSpent,
    auxiliaryTokensSpent,
    lastSessionTokensSeen: normalizedCurrent,
    tokensUsedHighWater: Math.max(goal.tokensUsedHighWater, observedTotal),
  }
}

interface EvolveGoalOptions {
  readonly now: number
  readonly historyType?: GrokGoalHistoryType
  readonly detail?: string | null
  readonly patch?: Partial<GrokGoalSnapshot>
}

export function evolveGoal(goal: GrokGoalSnapshot, options: EvolveGoalOptions): GrokGoalSnapshot {
  const history = options.historyType === undefined
    ? goal.history
    : [
        ...goal.history,
        { type: options.historyType, at: options.now, detail: options.detail ?? null },
      ].slice(-GOAL_HISTORY_LIMIT)
  return {
    ...goal,
    ...options.patch,
    updatedAt: options.now,
    revision: goal.revision + 1,
    history,
  }
}

export function beginGoalActivity(
  goal: GrokGoalSnapshot,
  now: number,
  activity: GrokGoalActivity,
  phase: GrokGoalSnapshot['phase'],
  historyType?: GrokGoalHistoryType,
  detail?: string,
): GrokGoalSnapshot {
  if (goal.status !== 'active') {
    throw new GoalTransitionError(`Cannot start ${activity} while goal status is ${goal.status}.`)
  }
  return evolveGoal(goal, {
    now,
    historyType,
    detail,
    patch: { activity, phase, pauseMessage: null },
  })
}

export function pauseGoal(
  goal: GrokGoalSnapshot,
  now: number,
  status: Exclude<GrokGoalStatus, 'active' | 'budget_limited' | 'complete'>,
  pauseMessage: string,
  patch: Partial<GrokGoalSnapshot> = {},
  historyType: GrokGoalHistoryType = 'paused',
): GrokGoalSnapshot {
  if (goal.status !== 'active') {
    throw new GoalTransitionError(`Only an active goal can pause; current status is ${goal.status}.`)
  }
  return evolveGoal(goal, {
    now,
    historyType,
    detail: pauseMessage,
    patch: {
      ...patch,
      status,
      phase: 'idle',
      activity: 'idle',
      elapsedMs: goalElapsedMs(goal, now),
      activeSince: null,
      pauseMessage,
    },
  })
}

export function resumeGoal(goal: GrokGoalSnapshot, now: number): GrokGoalSnapshot {
  if (!isPausedGoalStatus(goal.status)) {
    throw new GoalTransitionError(
      isTerminalGoalStatus(goal.status)
        ? `Goal status ${goal.status} is terminal; clear it before creating another goal.`
        : 'Goal is already active.',
    )
  }
  return evolveGoal(goal, {
    now,
    historyType: 'resumed',
    detail: 'Automatic pause counters reset.',
    patch: {
      status: 'active',
      phase: goal.plan === null ? 'planning' : 'executing',
      activity: goal.plan === null ? 'planning' : 'working',
      activeSince: now,
      classifierRunsAttempted: 0,
      consecutiveNotAchieved: 0,
      lastStrategistFiredAt: 0,
      strategistCapBonus: 0,
      roundsSinceVerify: 0,
      lastGapFingerprint: null,
      classifierStallCount: 0,
      evaluatorBlockerKey: null,
      evaluatorBlockedStreak: 0,
      strategy: null,
      pauseMessage: null,
    },
  })
}

function finishGoal(
  goal: GrokGoalSnapshot,
  now: number,
  status: 'budget_limited' | 'complete',
  historyType: 'budget_exceeded' | 'completed',
  detail: string,
  patch: Partial<GrokGoalSnapshot> = {},
): GrokGoalSnapshot {
  if (goal.status !== 'active' && !isPausedGoalStatus(goal.status)) {
    throw new GoalTransitionError(`Cannot finish goal from status ${goal.status}.`)
  }
  return evolveGoal(goal, {
    now,
    historyType,
    detail,
    patch: {
      ...patch,
      status,
      phase: 'idle',
      activity: 'idle',
      elapsedMs: goalElapsedMs(goal, now),
      activeSince: null,
      pauseMessage: status === 'budget_limited' ? detail : null,
    },
  })
}

export function completeGoal(
  goal: GrokGoalSnapshot,
  now: number,
  detail: string,
  patch: Partial<GrokGoalSnapshot> = {},
): GrokGoalSnapshot {
  return finishGoal(goal, now, 'complete', 'completed', detail, {
    ...patch,
    consecutiveNotAchieved: 0,
    lastStrategistFiredAt: 0,
    strategistCapBonus: 0,
    strategy: null,
  })
}

export function budgetLimitGoal(
  goal: GrokGoalSnapshot,
  now: number,
  patch: Partial<GrokGoalSnapshot> = {},
): GrokGoalSnapshot {
  const used = patch.tokensUsedHighWater ?? goal.tokensUsedHighWater
  const budget = goal.tokenBudget ?? used
  return finishGoal(
    goal,
    now,
    'budget_limited',
    'budget_exceeded',
    `Token budget reached (${formatTokens(used)} / ${formatTokens(budget)}).`,
    {
      ...patch,
      consecutiveNotAchieved: 0,
      lastStrategistFiredAt: 0,
      strategistCapBonus: 0,
      strategy: null,
    },
  )
}

export function goalHasExceededBudget(goal: GrokGoalSnapshot): boolean {
  return goal.tokenBudget !== null && goal.tokensUsedHighWater >= goal.tokenBudget
}

export function goalVerifierAttemptCap(goal: GrokGoalSnapshot): number {
  return goal.classifierMaxRuns + goal.strategistCapBonus
}

export function goalVerifierStallThreshold(goal: GrokGoalSnapshot): number {
  return goal.strategistCapBonus > 0
    ? GOAL_STRATEGIST_STALL_THRESHOLD
    : GOAL_CLASSIFIER_STALL_THRESHOLD
}

export function strategistShouldFire(
  consecutiveNotAchieved: number,
  lastStrategistFiredAt: number,
  every: number,
): boolean {
  if (!Number.isSafeInteger(every) || every < 1) return false
  return consecutiveNotAchieved >= lastStrategistFiredAt + every
}

export function verifierVariantCQuorum(findings: readonly GrokGoalVerifierFinding[]): boolean {
  if (findings.length === 0) return false
  if (findings.length === 1) return findings[0]?.refuted === false
  const cold = findings.filter(finding => finding.skepticIndex >= 1)
  if (cold.length === 0) return false
  const approvals = cold.filter(finding => !finding.refuted).length
  return approvals >= Math.floor(cold.length / 2) + 1
}

const SCRATCH_PATH_MARKERS = ['/tmp/', '/var/folders/', '/private/tmp/'] as const

function normalizeScratchPaths(text: string): string {
  if (!SCRATCH_PATH_MARKERS.some(marker => text.includes(marker))) return text
  return text
    .split(/\s+/)
    .map(token => SCRATCH_PATH_MARKERS.some(marker => token.includes(marker)) ? '<scratch>' : token)
    .join(' ')
}

function extractPathLineTokens(text: string): string[] {
  const tokens: string[] = []
  for (const raw of text.split(/\s+/)) {
    const word = raw.replace(/^[^a-zA-Z0-9./_:\-]+|[^a-zA-Z0-9./_:\-]+$/g, '')
    const colon = word.indexOf(':')
    if (colon < 1) continue
    const path = word.slice(0, colon)
    const line = word.slice(colon + 1).split(':')[0] ?? ''
    if ((path.includes('/') || path.includes('.')) && /^\d+$/.test(line)) {
      tokens.push(`${path.toLowerCase()}:${line}`)
    }
  }
  return tokens
}

export function fingerprintVerifierGaps(findings: readonly GrokGoalVerifierFinding[]): string {
  const evidence = findings
    .filter(finding => finding.refuted)
    .map(finding => normalizeScratchPaths(
      finding.evidence.trim().length > 0 ? finding.evidence : finding.details,
    ))
  const pathTokens = evidence.flatMap(extractPathLineTokens)
  const normalized = (pathTokens.length > 0
    ? pathTokens
    : evidence.map(item => item.trim().toLowerCase()).filter(item => item.length > 0))
    .sort()
  return [...new Set(normalized)].join('\n')
}

export interface ComposedVerifierFinalResponse {
  readonly toSend: string
  readonly toPersist: string | null
}

export function composeVerifierFinalResponse(
  first: string | null,
  current: string,
): ComposedVerifierFinalResponse {
  if (first === null) {
    const trimmed = current.trim()
    return {
      toSend: current,
      toPersist: trimmed.length === 0 ? null : [...current].slice(0, 4_096).join(''),
    }
  }
  const note = current.trim()
  return {
    toSend: note.length === 0 || note === first.trim()
      ? first
      : `${first}\n\n## Changes this round\n${note}`,
    toPersist: null,
  }
}

export function nextStepFromPlan(plan: GrokGoalPlan | null): string {
  const task = plan?.tasks.find(item => item.trim().length > 0)
  if (task !== undefined) return task
  const criterion = plan?.acceptanceCriteria.find(item => item.trim().length > 0)
  if (criterion !== undefined) return `Verify the remaining outcome: ${criterion}`
  return 'Check the current todo list and continue the highest-priority unfinished step.'
}

export function neutralizeGoalReminderText(value: string, maxChars = 800): string {
  const neutralized = value
    .replaceAll('<system-reminder', '<\u200bsystem-reminder')
    .replaceAll('</system-reminder', '<\u200b/system-reminder')
    .replaceAll('<goal-state', '<\u200bgoal-state')
    .replaceAll('</goal-state', '<\u200b/goal-state')
    .replace(/\s+/g, ' ')
    .trim()
  if (neutralized.length <= maxChars) return neutralized
  return `${neutralized.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`
}

export function normalizeBlockerKey(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return normalized.length === 0 ? 'unspecified_blocker' : normalized.slice(0, 80)
}

export function formatTokens(tokens: number): string {
  if (tokens < 1_000) return String(tokens)
  if (tokens < 1_000_000) {
    const value = tokens / 1_000
    return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)}K`
  }
  const value = tokens / 1_000_000
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)}M`
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1_000))
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  if (minutes < 60) return `${minutes}m ${totalSeconds % 60}s`
  const hours = Math.floor(minutes / 60)
  return `${hours}h ${minutes % 60}m`
}
