/** Shared client and Host settings namespace. */
export const GROK_GOAL_SETTINGS_NAMESPACE = 'dsh-grok-goals'

/** User-owned Grok Goal settings. */
export interface GrokGoalSettings {
  readonly enabled?: boolean
  readonly classifierMaxRuns?: number
  readonly verifierCount?: number
  readonly strategistEvery?: number
  readonly unlimitedTokenBudget?: boolean
  readonly defaultTokenBudget?: number
}
