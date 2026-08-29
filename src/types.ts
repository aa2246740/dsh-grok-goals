import { z } from 'zod'

export const GROK_GOAL_STATUSES = [
  'active',
  'user_paused',
  'back_off_paused',
  'no_progress_paused',
  'infra_paused',
  'blocked',
  'budget_limited',
  'complete',
] as const

export type GrokGoalStatus = typeof GROK_GOAL_STATUSES[number]

export const GROK_GOAL_PHASES = ['idle', 'planning', 'executing'] as const
export type GrokGoalPhase = typeof GROK_GOAL_PHASES[number]

export const GROK_GOAL_ACTIVITIES = [
  'idle',
  'planning',
  'working',
  'evaluating',
  'verifying',
  'strategizing',
  'summarizing',
] as const

export type GrokGoalActivity = typeof GROK_GOAL_ACTIVITIES[number]
export type GrokGoalKind = 'code-change' | 'analysis' | 'research'
export type GrokGoalConfidence = 'high' | 'medium' | 'low'
export type GrokGoalBlocking = 'none' | 'contradiction' | 'unverifiable'

export interface GrokGoalVerificationStep {
  readonly classification: 'gating' | 'evidence'
  readonly step: string
}

export interface GrokGoalPlan {
  readonly kind: GrokGoalKind
  readonly acceptanceCriteria: readonly string[]
  readonly verificationPlan: readonly GrokGoalVerificationStep[]
  readonly nonGoals: readonly string[]
  readonly assumedScope: readonly string[]
  readonly approach: readonly string[]
  readonly tasks: readonly string[]
  readonly risks: readonly string[]
  readonly markdown: string
}

export interface GrokGoalVerifierFinding {
  readonly skepticIndex: number
  readonly refuted: boolean
  readonly evidence: string
  readonly confidence: GrokGoalConfidence
  readonly blocking: GrokGoalBlocking
  readonly details: string
}

export interface GrokGoalVerificationSummary {
  readonly attempt: number
  readonly achieved: boolean
  readonly refutedCount: number
  readonly total: number
  readonly findings: readonly GrokGoalVerifierFinding[]
}

export const GROK_GOAL_HISTORY_TYPES = [
  'created',
  'planning_started',
  'planning_completed',
  'planning_failed',
  'worker_round_completed',
  'evaluation_started',
  'evaluation_continued',
  'evaluation_blocked',
  'verification_started',
  'verification_refuted',
  'strategist_completed',
  'paused',
  'resumed',
  'completed',
  'budget_exceeded',
  'summary_completed',
  'cleared',
] as const

export type GrokGoalHistoryType = typeof GROK_GOAL_HISTORY_TYPES[number]

export interface GrokGoalHistoryEntry {
  readonly type: GrokGoalHistoryType
  readonly at: number
  readonly detail: string | null
}

export interface GrokGoalSnapshot {
  readonly schemaVersion: 1
  readonly goalId: string
  readonly verifierId: string
  readonly objective: string
  readonly status: GrokGoalStatus
  readonly phase: GrokGoalPhase
  readonly activity: GrokGoalActivity
  readonly tokenBudget: number | null
  readonly tokenBaseline: number
  readonly parentTokensSpent: number
  readonly auxiliaryTokensSpent: number
  readonly lastSessionTokensSeen: number
  readonly tokensUsedHighWater: number
  readonly elapsedMs: number
  readonly activeSince: number | null
  readonly totalWorkerRounds: number
  readonly totalVerifyRounds: number
  readonly classifierRunsAttempted: number
  readonly classifierMaxRuns: number
  readonly consecutiveNotAchieved: number
  readonly lastStrategistFiredAt: number
  readonly strategistCapBonus: number
  readonly roundsSinceVerify: number
  readonly lastVerifierVerdict: 'achieved' | 'not_achieved' | null
  readonly lastVerifierGaps: readonly string[]
  readonly lastGapFingerprint: string | null
  readonly classifierStallCount: number
  readonly lastVerification: GrokGoalVerificationSummary | null
  readonly evaluatorBlockerKey: string | null
  readonly evaluatorBlockedStreak: number
  readonly plan: GrokGoalPlan | null
  readonly strategy: string | null
  readonly nextStep: string | null
  readonly pauseMessage: string | null
  readonly completionSummary: string | null
  readonly firstFinalResponse: string | null
  readonly createdAt: number
  readonly updatedAt: number
  readonly revision: number
  readonly history: readonly GrokGoalHistoryEntry[]
}

export type GrokGoalProjection = GrokGoalSnapshot | null

export type GrokGoalChangeOperation = GrokGoalHistoryType | 'state_updated'

const verificationStepSchema = z.object({
  classification: z.enum(['gating', 'evidence']),
  step: z.string(),
})

const planSchema: z.ZodType<GrokGoalPlan> = z.object({
  kind: z.enum(['code-change', 'analysis', 'research']),
  acceptanceCriteria: z.array(z.string()),
  verificationPlan: z.array(verificationStepSchema),
  nonGoals: z.array(z.string()),
  assumedScope: z.array(z.string()),
  approach: z.array(z.string()),
  tasks: z.array(z.string()),
  risks: z.array(z.string()),
  markdown: z.string(),
})

const verifierFindingSchema: z.ZodType<GrokGoalVerifierFinding> = z.object({
  skepticIndex: z.number().int().nonnegative(),
  refuted: z.boolean(),
  evidence: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  blocking: z.enum(['none', 'contradiction', 'unverifiable']),
  details: z.string(),
})

const verificationSummarySchema: z.ZodType<GrokGoalVerificationSummary> = z.object({
  attempt: z.number().int().positive(),
  achieved: z.boolean(),
  refutedCount: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  findings: z.array(verifierFindingSchema),
})

const historyEntrySchema: z.ZodType<GrokGoalHistoryEntry> = z.object({
  type: z.enum(GROK_GOAL_HISTORY_TYPES),
  at: z.number().nonnegative(),
  detail: z.string().nullable(),
})

export const grokGoalSnapshotSchema: z.ZodType<GrokGoalSnapshot> = z.object({
  schemaVersion: z.literal(1),
  goalId: z.string().min(1),
  verifierId: z.string().regex(/^[0-9a-f]{12}$/),
  objective: z.string().min(1),
  status: z.enum(GROK_GOAL_STATUSES),
  phase: z.enum(GROK_GOAL_PHASES),
  activity: z.enum(GROK_GOAL_ACTIVITIES),
  tokenBudget: z.number().int().positive().nullable(),
  tokenBaseline: z.number().int().nonnegative(),
  parentTokensSpent: z.number().int().nonnegative(),
  auxiliaryTokensSpent: z.number().int().nonnegative(),
  lastSessionTokensSeen: z.number().int().nonnegative(),
  tokensUsedHighWater: z.number().int().nonnegative(),
  elapsedMs: z.number().int().nonnegative(),
  activeSince: z.number().int().nonnegative().nullable(),
  totalWorkerRounds: z.number().int().nonnegative(),
  totalVerifyRounds: z.number().int().nonnegative(),
  classifierRunsAttempted: z.number().int().nonnegative(),
  classifierMaxRuns: z.number().int().positive(),
  consecutiveNotAchieved: z.number().int().nonnegative(),
  lastStrategistFiredAt: z.number().int().nonnegative(),
  strategistCapBonus: z.number().int().nonnegative(),
  roundsSinceVerify: z.number().int().nonnegative(),
  lastVerifierVerdict: z.enum(['achieved', 'not_achieved']).nullable(),
  lastVerifierGaps: z.array(z.string()),
  lastGapFingerprint: z.string().nullable(),
  classifierStallCount: z.number().int().nonnegative(),
  lastVerification: verificationSummarySchema.nullable(),
  evaluatorBlockerKey: z.string().nullable(),
  evaluatorBlockedStreak: z.number().int().nonnegative(),
  plan: planSchema.nullable(),
  strategy: z.string().nullable(),
  nextStep: z.string().nullable(),
  pauseMessage: z.string().nullable(),
  completionSummary: z.string().nullable(),
  firstFinalResponse: z.string().nullable(),
  createdAt: z.number().int().nonnegative(),
  updatedAt: z.number().int().nonnegative(),
  revision: z.number().int().positive(),
  history: z.array(historyEntrySchema),
})

export const grokGoalProjectionSchema: z.ZodType<GrokGoalProjection> = grokGoalSnapshotSchema.nullable()

export function isGrokGoalStatus(value: string): value is GrokGoalStatus {
  return GROK_GOAL_STATUSES.some(status => status === value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseRestoredGoal(value: unknown): GrokGoalSnapshot | null {
  if (!isRecord(value)) return null
  const status = value.status
  const normalized = typeof status === 'string' && !isGrokGoalStatus(status)
    ? {
        ...value,
        status: 'user_paused',
        phase: 'idle',
        activity: 'idle',
        activeSince: null,
        pauseMessage: `Unknown persisted goal status “${status}”; paused for safety.`,
      }
    : value
  const parsed = grokGoalSnapshotSchema.safeParse(normalized)
  return parsed.success ? parsed.data : null
}
