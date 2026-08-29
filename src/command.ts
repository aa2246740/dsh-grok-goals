export type ParsedGoalCommand =
  | { readonly kind: 'status' }
  | { readonly kind: 'pause' }
  | { readonly kind: 'resume' }
  | { readonly kind: 'clear' }
  | { readonly kind: 'create'; readonly objective: string; readonly tokenBudget: number | null }

export function parseGoalCommand(input: string): ParsedGoalCommand {
  const trimmed = input.trim()
  const control = trimmed.toLowerCase()
  if (control.length === 0 || control === 'status') return { kind: 'status' }
  if (control === 'pause') return { kind: 'pause' }
  if (control === 'resume') return { kind: 'resume' }
  if (control === 'clear') return { kind: 'clear' }

  const flag = '--budget'
  const flagIndex = trimmed.lastIndexOf(flag)
  if (flagIndex >= 0) {
    const rawHead = trimmed.slice(0, flagIndex)
    const rawTail = trimmed.slice(flagIndex + flag.length)
    const value = rawTail.trim()
    const head = rawHead.trimEnd()
    const flagIsOwnToken = /\s$/.test(rawHead)
      && /^\s/.test(rawTail)
      && value.length > 0
      && !/\s/.test(value)
    if (flagIsOwnToken && head.length > 0 && /^\d+$/.test(value)) {
      const tokenBudget = Number(value)
      if (Number.isSafeInteger(tokenBudget) && tokenBudget > 0) {
        return { kind: 'create', objective: head, tokenBudget }
      }
    }
  }

  return { kind: 'create', objective: trimmed, tokenBudget: null }
}
