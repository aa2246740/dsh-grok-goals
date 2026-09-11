import type { Context, Fiber } from '@deepseek-ai/cordis'

interface OfficialEntry {
  options: { name: string; disabled?: boolean | null }
  fiber?: Fiber
  context: Context
  update(options: { disabled?: boolean | null }): Promise<void>
}

const OFFICIAL_GOAL_PLUGINS = new Set([
  '@deepseek-ai/dsh-command-goal',
  '@deepseek-ai/dsh-tool-goal',
  '@deepseek-ai/dsh-client-ui-goal',
])

/** Suppress official goal command/tool/UI across every preset without rewriting DSH. */
export function installGoalReplacement(ctx: Context): Promise<void> {
  const owned = new Map<OfficialEntry, { previous: boolean | null | undefined; options: OfficialEntry['options'] }>()
  const pending = new Set<Promise<void>>()
  let restoring = false
  const track = (work: Promise<void>) => {
    pending.add(work)
    void work.finally(() => pending.delete(work)).catch(error => {
      ctx.logger.error('grok-goals replacement lifecycle failed: %o', error)
    })
    return work
  }
  const suppress = (fiber: Fiber) => {
    if (restoring || fiber.uid === null) return
    const entry = (fiber as Fiber & { entry?: OfficialEntry }).entry
    if (entry === undefined || !OFFICIAL_GOAL_PLUGINS.has(entry.options.name) || entry.options.disabled === true) return
    if (entry.fiber !== undefined && entry.fiber.uid !== null && entry.fiber.uid !== fiber.uid) return
    const previous = entry.options.disabled
    const update = entry.update({ disabled: true })
    const saved = { previous, options: entry.options }
    owned.set(entry, saved)
    const dispose = fiber.uid === null ? Promise.resolve() : fiber.dispose()
    track(Promise.all([update, dispose]).then(() => { saved.options = entry.options }))
  }
  const stop = ctx.on('internal/plugin', suppress, { global: true })
  ctx.effect(() => async () => {
    restoring = true
    stop()
    await Promise.allSettled([...pending])
    for (const [entry, saved] of owned) {
      if (entry.context.fiber.uid === null || entry.options !== saved.options || entry.options.disabled !== true) continue
      await entry.update({ disabled: saved.previous ?? null })
    }
    owned.clear()
  }, 'grok-goals: restore replaced official rows')
  for (const runtime of [...ctx.registry.values()]) {
    for (const fiber of [...runtime.fibers]) suppress(fiber)
  }
  return Promise.all([...pending]).then(() => undefined)
}
