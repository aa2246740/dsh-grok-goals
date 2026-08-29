import { describe, expect, it } from 'vitest'
import { parseGoalCommand } from '../src/command.ts'

describe('/goal grammar', () => {
  it('maps empty and status input to status', () => {
    expect(parseGoalCommand('')).toEqual({ kind: 'status' })
    expect(parseGoalCommand('  status  ')).toEqual({ kind: 'status' })
  })

  it('parses control verbs case-insensitively', () => {
    expect(parseGoalCommand('PAUSE')).toEqual({ kind: 'pause' })
    expect(parseGoalCommand('Resume')).toEqual({ kind: 'resume' })
    expect(parseGoalCommand('clear')).toEqual({ kind: 'clear' })
    expect(parseGoalCommand('STATUS')).toEqual({ kind: 'status' })
  })

  it('parses only a trailing standalone token budget', () => {
    expect(parseGoalCommand('Implement the parser --budget 12000')).toEqual({
      kind: 'create',
      objective: 'Implement the parser',
      tokenBudget: 12_000,
    })
    expect(parseGoalCommand('Document --budget behavior')).toEqual({
      kind: 'create',
      objective: 'Document --budget behavior',
      tokenBudget: null,
    })
  })

  it('preserves malformed, empty-objective, signed, and non-positive budget text verbatim', () => {
    for (const objective of [
      'Build it --budget nope',
      '--budget 10',
      'Build it --budget 0',
      'Build it --budget -5',
      'fix the --budget flag parsing bug',
    ]) {
      expect(parseGoalCommand(objective)).toEqual({ kind: 'create', objective, tokenBudget: null })
    }
  })
})
