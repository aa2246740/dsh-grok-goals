import { describe, expect, it } from 'vitest'
import { resolveConfig, resolveGoalTokenBudget } from '../src/budget.ts'

describe('goal token budget settings', () => {
  it('defaults to unlimited tokens', () => {
    expect(resolveConfig({}).unlimitedTokenBudget).toBe(true)
    expect(resolveGoalTokenBudget({
      explicitBudget: null,
      config: resolveConfig({}),
    })).toBeNull()
  })

  it('uses the settings cap when unlimited is off and no /goal --budget was given', () => {
    expect(resolveGoalTokenBudget({
      explicitBudget: null,
      config: resolveConfig({ unlimitedTokenBudget: false, defaultTokenBudget: 50_000 }),
    })).toBe(50_000)
  })

  it('lets a trailing /goal --budget override the settings default', () => {
    expect(resolveGoalTokenBudget({
      explicitBudget: 12_000,
      config: resolveConfig({ unlimitedTokenBudget: false, defaultTokenBudget: 50_000 }),
    })).toBe(12_000)
    expect(resolveGoalTokenBudget({
      explicitBudget: 12_000,
      config: resolveConfig({}),
    })).toBe(12_000)
  })
})
