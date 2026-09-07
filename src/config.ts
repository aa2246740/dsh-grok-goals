import z from '@deepseek-ai/schemastery'
import type { GrokGoalSettings } from './settings-contract.js'

export type { GrokGoalSettings } from './settings-contract.js'
export { GROK_GOAL_SETTINGS_NAMESPACE } from './settings-contract.js'
export {
  resolveConfig,
  resolveGoalTokenBudget,
  type ResolvedConfig,
} from './budget.js'

export type Config = GrokGoalSettings

export const Config: z<Config> = z.object({
  enabled: z.boolean().default(true),
  classifierMaxRuns: z.number().step(1).min(1).default(10),
  verifierCount: z.number().step(1).min(1).max(5).default(3),
  strategistEvery: z.number().step(1).min(1).default(5),
  unlimitedTokenBudget: z.boolean().default(true),
  defaultTokenBudget: z.number().step(1).min(1).default(200_000),
})
