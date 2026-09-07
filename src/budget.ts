import type { GrokGoalSettings } from './settings-contract.js'

export interface ResolvedConfig {
  readonly enabled: boolean
  readonly classifierMaxRuns: number
  readonly verifierCount: number
  readonly strategistEvery: number
  readonly unlimitedTokenBudget: boolean
  readonly defaultTokenBudget: number
}

export function resolveConfig(config: GrokGoalSettings): ResolvedConfig {
  const resolved = {
    enabled: config.enabled ?? true,
    classifierMaxRuns: config.classifierMaxRuns ?? 10,
    verifierCount: config.verifierCount ?? 3,
    strategistEvery: config.strategistEvery ?? 5,
    unlimitedTokenBudget: config.unlimitedTokenBudget ?? true,
    defaultTokenBudget: config.defaultTokenBudget ?? 200_000,
  }
  if (!Number.isSafeInteger(resolved.classifierMaxRuns) || resolved.classifierMaxRuns < 1) {
    throw new TypeError('classifierMaxRuns must be a positive safe integer')
  }
  if (!Number.isSafeInteger(resolved.verifierCount)
    || resolved.verifierCount < 1
    || resolved.verifierCount > 5) {
    throw new TypeError('verifierCount must be an integer from 1 through 5')
  }
  if (!Number.isSafeInteger(resolved.strategistEvery) || resolved.strategistEvery < 1) {
    throw new TypeError('strategistEvery must be a positive safe integer')
  }
  if (!Number.isSafeInteger(resolved.defaultTokenBudget) || resolved.defaultTokenBudget < 1) {
    throw new TypeError('defaultTokenBudget must be a positive safe integer')
  }
  return resolved
}

export function resolveGoalTokenBudget(input: {
  readonly explicitBudget: number | null
  readonly config: Pick<ResolvedConfig, 'unlimitedTokenBudget' | 'defaultTokenBudget'>
}): number | null {
  if (input.explicitBudget !== null) return input.explicitBudget
  return input.config.unlimitedTokenBudget ? null : input.config.defaultTokenBudget
}
