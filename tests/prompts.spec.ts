import { describe, expect, it } from 'vitest'
import { parseEvaluatorDecision, parseGoalPlan } from '../src/prompts.ts'

describe('planner and evaluator boundaries', () => {
  it('renders a frozen Markdown plan from validated structured output', () => {
    const plan = parseGoalPlan({
      kind: 'code-change',
      acceptanceCriteria: ['The shipped command works.', 'The UI exposes verifier gaps.'],
      verificationPlan: [
        { classification: 'gating', step: 'Run the real command path.' },
        { classification: 'evidence', step: 'Capture the detail dialog.' },
      ],
      nonGoals: ['Do not restyle the entire app.'],
      assumedScope: [],
      approach: ['Keep the host state machine separate from adapters.'],
      tasks: ['Implement state', 'Wire adapters', 'Run tests'],
      risks: [],
    })

    expect(plan?.markdown).toContain('## Acceptance criteria')
    expect(plan?.markdown).toContain('- [ ] Implement state')
    expect(plan?.markdown).toContain('[gating] Run the real command path.')
  })

  it('rejects code-change plans without a usable task checklist', () => {
    expect(parseGoalPlan({
      kind: 'code-change',
      acceptanceCriteria: ['Works'],
      verificationPlan: [{ classification: 'gating', step: 'Test it' }],
      nonGoals: [],
      assumedScope: [],
      approach: [],
      tasks: ['Only one task'],
      risks: [],
    })).toBeNull()
  })

  it('extracts one strict evaluator JSON object and rejects invalid decisions', () => {
    expect(parseEvaluatorDecision('prefix {"decision":"continue","reason":"tests remain","next_step":"run tests","blocker_key":""} suffix')).toEqual({
      decision: 'continue',
      reason: 'tests remain',
      next_step: 'run tests',
      blocker_key: '',
    })
    expect(parseEvaluatorDecision('{"decision":"done","reason":"ok","next_step":"","blocker_key":""}')).toBeNull()
  })
})
