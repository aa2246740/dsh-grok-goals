import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import type { TodoItem } from '@deepseek-ai/dsh-tool-todo/client'
import {
  Button,
  IconChevronDownOutline14,
  IconGoalOutline16,
  IconPauseOutline16,
  IconPlayOutline16,
  IconTrashOutline16,
  Modal,
  Tooltip,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  GrokGoalActivity,
  GrokGoalHistoryType,
  GrokGoalProjection,
  GrokGoalSnapshot,
  GrokGoalStatus,
} from '../types.js'
import type { GrokGoalKey } from './locales.js'
import css from './GrokGoalDock.module.css'

export interface GrokGoalDockInjected {
  readonly locale: string
  readonly sessionId: string
  readonly loadGoal: () => Promise<GrokGoalProjection>
  readonly runGoalCommand: (line: string) => Promise<string | null>
}

export type GrokGoalDockProps = PropsRuntime<'conversation.input.dock'>
  & PropsLocale<'grokGoal'>
  & GrokGoalDockInjected

const STATUS_LABELS: Record<GrokGoalStatus, GrokGoalKey> = {
  active: 'status.active',
  user_paused: 'status.user_paused',
  back_off_paused: 'status.back_off_paused',
  no_progress_paused: 'status.no_progress_paused',
  infra_paused: 'status.infra_paused',
  blocked: 'status.blocked',
  budget_limited: 'status.budget_limited',
  complete: 'status.complete',
}

const ACTIVITY_LABELS: Record<GrokGoalActivity, GrokGoalKey> = {
  idle: 'activity.idle',
  planning: 'activity.planning',
  working: 'activity.working',
  evaluating: 'activity.evaluating',
  verifying: 'activity.verifying',
  strategizing: 'activity.strategizing',
  summarizing: 'activity.summarizing',
}

const TODO_LABELS: Record<TodoItem['status'], GrokGoalKey> = {
  pending: 'todo.pending',
  in_progress: 'todo.in_progress',
  completed: 'todo.completed',
}

const HISTORY_LABELS: Record<GrokGoalHistoryType, GrokGoalKey> = {
  created: 'history.created',
  planning_started: 'history.planning_started',
  planning_completed: 'history.planning_completed',
  planning_failed: 'history.planning_failed',
  worker_round_completed: 'history.worker_round_completed',
  evaluation_started: 'history.evaluation_started',
  evaluation_continued: 'history.evaluation_continued',
  evaluation_blocked: 'history.evaluation_blocked',
  verification_started: 'history.verification_started',
  verification_refuted: 'history.verification_refuted',
  strategist_completed: 'history.strategist_completed',
  paused: 'history.paused',
  resumed: 'history.resumed',
  completed: 'history.completed',
  budget_exceeded: 'history.budget_exceeded',
  summary_completed: 'history.summary_completed',
  cleared: 'history.cleared',
}

function isPaused(status: GrokGoalStatus): boolean {
  return status === 'user_paused'
    || status === 'back_off_paused'
    || status === 'no_progress_paused'
    || status === 'infra_paused'
    || status === 'blocked'
}

function formatTokens(tokens: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    notation: tokens >= 1_000 ? 'compact' : 'standard',
    maximumFractionDigits: tokens >= 10_000 ? 0 : 1,
  }).format(tokens)
}

function formatElapsed(ms: number): string {
  const seconds = Math.max(0, Math.floor(ms / 1_000))
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function useCurrentTime(active: boolean): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!active) return undefined
    const timer = window.setInterval(() => { setNow(Date.now()) }, 1_000)
    return () => { window.clearInterval(timer) }
  }, [active])
  return now
}

function useGrokGoal(sessionId: string, loadGoal: GrokGoalDockInjected['loadGoal']) {
  const [goal, setGoal] = useState<GrokGoalProjection>(null)
  const loadGoalRef = useRef(loadGoal)
  useEffect(() => {
    loadGoalRef.current = loadGoal
  }, [loadGoal])

  const refresh = useCallback(async (): Promise<GrokGoalProjection> => {
    const next = await loadGoalRef.current()
    setGoal(next)
    return next
  }, [])

  useEffect(() => {
    let disposed = false
    let running = false
    setGoal(null)
    const tick = async (): Promise<void> => {
      if (disposed || running) return
      running = true
      try {
        const next = await loadGoalRef.current()
        if (!disposed) setGoal(next)
      } catch {
        // The shell owns connection-state feedback. Preserve the last good goal.
      } finally {
        running = false
      }
    }
    void tick()
    const timer = window.setInterval(() => { void tick() }, 500)
    return () => {
      disposed = true
      window.clearInterval(timer)
    }
  }, [sessionId])

  return { goal, refresh }
}

function effectiveElapsed(goal: GrokGoalSnapshot, now: number): number {
  return goal.elapsedMs + (goal.activeSince === null ? 0 : Math.max(0, now - goal.activeSince))
}

function verifierLabel(goal: GrokGoalSnapshot, t: GrokGoalDockProps['t']): string {
  if (goal.lastVerifierVerdict === null) return t('verifier.none')
  return t(goal.lastVerifierVerdict === 'achieved' ? 'verifier.achieved' : 'verifier.not_achieved')
}

function displayedStatusKey(goal: GrokGoalSnapshot): GrokGoalKey {
  if (goal.status === 'active') return ACTIVITY_LABELS[goal.activity]
  return STATUS_LABELS[goal.status]
}

function taskStatus(task: string, todos: readonly TodoItem[]): TodoItem['status'] {
  return todos.find(todo => todo.content.trim() === task.trim())?.status ?? 'pending'
}

function GoalDetail({
  goal,
  todos,
  open,
  pending,
  actionError,
  confirmClear,
  onClose,
  onPauseResume,
  onStartClear,
  onCancelClear,
  onConfirmClear,
  locale,
  t,
}: {
  readonly goal: GrokGoalSnapshot
  readonly todos: readonly TodoItem[]
  readonly open: boolean
  readonly pending: boolean
  readonly actionError: string | null
  readonly confirmClear: boolean
  readonly onClose: () => void
  readonly onPauseResume: () => void
  readonly onStartClear: () => void
  readonly onCancelClear: () => void
  readonly onConfirmClear: () => void
  readonly locale: string
  readonly t: GrokGoalDockProps['t']
}) {
  const detailRef = useRef<HTMLDivElement>(null)
  const now = useCurrentTime(open && goal.status === 'active')
  const elapsed = effectiveElapsed(goal, now)
  useEffect(() => {
    if (!open) return
    const detail = detailRef.current
    if (detail === null) return
    if (detail.parentElement !== null) detail.parentElement.scrollTop = 0
    detail.focus({ preventScroll: true })
  }, [open])
  const verifierCap = goal.classifierMaxRuns + goal.strategistCapBonus
  const budgetPercent = goal.tokenBudget === null
    ? null
    : Math.min(100, Math.max(0, goal.tokensUsedHighWater / goal.tokenBudget * 100))
  const canPauseResume = goal.status === 'active' || isPaused(goal.status)
  const recentHistory = useMemo(() => [...goal.history].slice(-8).reverse(), [goal.history])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('title')}
      closeLabel={t('action.close')}
      className={css.dialog}
      contentClassName={css.dialogContent}
      footer={confirmClear
        ? (
            <>
              <Button variant="outline" disabled={pending} onClick={onCancelClear}>{t('action.cancel')}</Button>
              <Button variant="primary" disabled={pending} icon={<IconTrashOutline16 size={14} />} onClick={onConfirmClear}>
                {t('action.confirmClear')}
              </Button>
            </>
          )
        : (
            <>
              <Button variant="outline" disabled={pending} icon={<IconTrashOutline16 size={14} />} onClick={onStartClear}>
                {t('action.clear')}
              </Button>
              {canPauseResume && (
                <Button
                  variant="primary"
                  disabled={pending}
                  icon={goal.status === 'active' ? <IconPauseOutline16 size={14} /> : <IconPlayOutline16 size={14} />}
                  onClick={onPauseResume}
                >
                  {t(goal.status === 'active' ? 'action.pause' : 'action.resume')}
                </Button>
              )}
            </>
          )}
    >
      <div ref={detailRef} className={css.detailRoot} tabIndex={-1} aria-busy={pending}>
        {actionError !== null && <div className={css.errorBanner} role="alert">{actionError}</div>}
        {confirmClear && (
          <div className={css.confirmBanner} role="group" aria-label={t('clear.title')}>
            <strong>{t('clear.title')}</strong>
            <span>{t('clear.description')}</span>
          </div>
        )}

        <section className={css.hero} data-ud-check="goal-objective">
          <div className={css.heroMeta}>
            <span className={css.statusChip} data-status={goal.status}>
              <span className={css.statusDot} aria-hidden />
              {t(STATUS_LABELS[goal.status])}
            </span>
            <span className={css.activityLabel}>{t(ACTIVITY_LABELS[goal.activity])}</span>
          </div>
          <h3>{goal.objective}</h3>
          <p>{t('engine.note')}</p>
        </section>

        <dl className={css.metrics} data-ud-check="goal-metrics">
          <div>
            <dt>{t('metric.tokens')}</dt>
            <dd>{formatTokens(goal.tokensUsedHighWater, locale)}{goal.tokenBudget === null ? '' : ` / ${formatTokens(goal.tokenBudget, locale)}`}</dd>
          </div>
          <div>
            <dt>{t('metric.elapsed')}</dt>
            <dd>{formatElapsed(elapsed)}</dd>
          </div>
          <div>
            <dt>{t('metric.workerRounds')}</dt>
            <dd>{goal.totalWorkerRounds}</dd>
          </div>
          <div>
            <dt>{t('metric.verifier')}</dt>
            <dd>{verifierLabel(goal, t)} · {goal.classifierRunsAttempted}/{verifierCap}</dd>
          </div>
        </dl>

        {budgetPercent !== null && (
          <div className={css.budgetBlock} aria-label={`${t('metric.tokens')}: ${Math.round(budgetPercent)}%`}>
            <div className={css.budgetTrack}><span style={{ width: `${budgetPercent}%` }} /></div>
          </div>
        )}

        {goal.pauseMessage !== null && (
          <section className={css.pausePanel} data-ud-check="goal-pause-reason">
            <strong>{t(STATUS_LABELS[goal.status])}</strong>
            <p>{goal.pauseMessage}</p>
            <span>{t('pause.hint')}</span>
          </section>
        )}

        {goal.nextStep !== null && (
          <section className={css.section} data-ud-check="goal-next-step">
            <h4>{t('section.nextStep')}</h4>
            <p className={css.nextStep}>{goal.nextStep}</p>
          </section>
        )}

        <section className={css.section} data-ud-check="goal-plan">
          <h4>{t('section.plan')}</h4>
          {goal.plan === null
            ? <p className={css.empty}>{t('empty.plan')}</p>
            : (
                <div className={css.planGrid}>
                  <div>
                    <h5>{t('section.criteria')}</h5>
                    <ol>{goal.plan.acceptanceCriteria.map(item => <li key={item}>{item}</li>)}</ol>
                  </div>
                  <div>
                    <h5>{t('section.verification')}</h5>
                    <ul className={css.verificationList}>
                      {goal.plan.verificationPlan.map(item => (
                        <li key={`${item.classification}:${item.step}`}>
                          <span data-kind={item.classification}>{t(item.classification === 'gating' ? 'verification.gating' : 'verification.evidence')}</span>
                          <p>{item.step}</p>
                        </li>
                      ))}
                    </ul>
                  </div>
                  {goal.plan.approach.length > 0 && (
                    <div>
                      <h5>{t('section.approach')}</h5>
                      <ol>{goal.plan.approach.map(item => <li key={item}>{item}</li>)}</ol>
                    </div>
                  )}
                  {goal.plan.assumedScope.length > 0 && (
                    <div>
                      <h5>{t('section.assumptions')}</h5>
                      <ul>{goal.plan.assumedScope.map(item => <li key={item}>{item}</li>)}</ul>
                    </div>
                  )}
                  {goal.plan.nonGoals.length > 0 && (
                    <div>
                      <h5>{t('section.nonGoals')}</h5>
                      <ul>{goal.plan.nonGoals.map(item => <li key={item}>{item}</li>)}</ul>
                    </div>
                  )}
                  {goal.plan.risks.length > 0 && (
                    <div>
                      <h5>{t('section.risks')}</h5>
                      <ul>{goal.plan.risks.map(item => <li key={item}>{item}</li>)}</ul>
                    </div>
                  )}
                  <div className={css.fullWidth}>
                    <h5>{t('section.tasks')}</h5>
                    {goal.plan.tasks.length === 0
                      ? <p className={css.empty}>{t('empty.tasks')}</p>
                      : (
                          <ul className={css.taskList}>
                            {goal.plan.tasks.map(task => {
                              const status = taskStatus(task, todos)
                              return (
                                <li key={task} data-status={status}>
                                  <span className={css.taskGlyph} aria-hidden />
                                  <span>{task}</span>
                                  <small>{t(TODO_LABELS[status])}</small>
                                </li>
                              )
                            })}
                          </ul>
                        )}
                  </div>
                </div>
              )}
        </section>

        <section className={css.section} data-ud-check="goal-verifier-gaps">
          <h4>{t('section.gaps')}</h4>
          {goal.lastVerifierGaps.length === 0
            ? <p className={css.empty}>{t('empty.gaps')}</p>
            : <ul className={css.gapList}>{goal.lastVerifierGaps.map(gap => <li key={gap}>{gap}</li>)}</ul>}
        </section>

        {goal.strategy !== null && (
          <section className={css.section} data-ud-check="goal-strategy">
            <h4>{t('section.strategy')}</h4>
            <pre className={css.strategy}>{goal.strategy}</pre>
          </section>
        )}

        {goal.completionSummary !== null && (
          <section className={css.section} data-ud-check="goal-summary">
            <h4>{t('section.summary')}</h4>
            <p className={css.summary}>{goal.completionSummary}</p>
          </section>
        )}

        <section className={css.section} data-ud-check="goal-history">
          <h4>{t('section.history')}</h4>
          <ol className={css.history}>
            {recentHistory.map((entry, index) => (
              <li key={`${entry.at}:${entry.type}:${index}`}>
                <time>{new Date(entry.at).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}</time>
                <span>{t(HISTORY_LABELS[entry.type])}</span>
                {entry.detail !== null && <p>{entry.detail}</p>}
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Modal>
  )
}

export function GrokGoalDock({ useProjection, locale, sessionId, loadGoal, runGoalCommand, t }: GrokGoalDockProps) {
  const { goal, refresh: refreshGoal } = useGrokGoal(sessionId, loadGoal)
  const todos = useProjection('todos') ?? []
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const pendingRef = useRef(false)
  const summaryButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setActionError(null)
    setConfirmClear(false)
  }, [goal?.goalId])

  if (goal === null) return null

  const budgetPercent = goal.tokenBudget === null
    ? null
    : Math.min(100, Math.max(0, goal.tokensUsedHighWater / goal.tokenBudget * 100))
  const paused = isPaused(goal.status)
  const verifierCap = goal.classifierMaxRuns + goal.strategistCapBonus

  const runAction = async (line: string, after?: () => void): Promise<void> => {
    if (pendingRef.current) return
    pendingRef.current = true
    setPending(true)
    setActionError(null)
    try {
      const error = await runGoalCommand(line)
      if (error === null) {
        await refreshGoal()
        after?.()
      } else {
        setActionError(error)
      }
    } catch (error: unknown) {
      setActionError(error instanceof Error ? error.message : String(error))
    } finally {
      pendingRef.current = false
      setPending(false)
    }
  }

  const pauseResume = () => {
    void runAction(goal.status === 'active' ? '/goal pause' : '/goal resume')
  }

  const confirmAndClear = () => {
    void runAction('/goal clear', () => {
      setConfirmClear(false)
      setOpen(false)
    })
  }

  const closeDialog = () => {
    setOpen(false)
    setConfirmClear(false)
    window.requestAnimationFrame(() => { summaryButtonRef.current?.focus() })
  }

  return (
    <div className={css.dock} data-goal-bar data-grok-goal>
      <div className={css.bar} data-status={goal.status}>
        <button
          ref={summaryButtonRef}
          type="button"
          className={css.summaryButton}
          onClick={() => { setOpen(true) }}
          aria-label={`${t('action.details')}: ${t(displayedStatusKey(goal))}. ${goal.objective}. ${t('metric.verifier')} ${goal.classifierRunsAttempted} / ${verifierCap}`}
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <span className={css.goalGlyph} aria-hidden><IconGoalOutline16 size={14} /></span>
          <span className={css.label} aria-live="polite">{t(displayedStatusKey(goal))}</span>
          <span className={css.objective}>{goal.objective}</span>
          <span className={css.tokenLabel}>{formatTokens(goal.tokensUsedHighWater, locale)}{goal.tokenBudget === null ? '' : ` / ${formatTokens(goal.tokenBudget, locale)}`}</span>
          <span className={css.verifierCompact} aria-hidden>
            {t('metric.verifierShort')} {goal.classifierRunsAttempted}/{verifierCap}
          </span>
          <span className={css.chevron} aria-hidden><IconChevronDownOutline14 /></span>
        </button>
        {(goal.status === 'active' || paused) && (
          <Tooltip label={t(goal.status === 'active' ? 'action.pause' : 'action.resume')} side="bottom" delayMs={500}>
            <button
              type="button"
              className={css.iconButton}
              disabled={pending}
              onClick={pauseResume}
              aria-label={t(goal.status === 'active' ? 'action.pause' : 'action.resume')}
            >
              {goal.status === 'active' ? <IconPauseOutline16 size={14} /> : <IconPlayOutline16 size={14} />}
            </button>
          </Tooltip>
        )}
        <Tooltip label={t('action.clear')} side="bottom" delayMs={500}>
          <button
            type="button"
            className={css.iconButton}
            disabled={pending}
            onClick={() => { setOpen(true); setConfirmClear(true) }}
            aria-label={t('action.clear')}
          >
            <IconTrashOutline16 size={14} />
          </button>
        </Tooltip>
        {actionError !== null && <span className={css.inlineError} role="alert">{actionError}</span>}
        {budgetPercent !== null && (
          <span className={css.dockBudget} aria-hidden><span style={{ width: `${budgetPercent}%` }} /></span>
        )}
      </div>

      <GoalDetail
        goal={goal}
        todos={todos}
        open={open}
        pending={pending}
        actionError={actionError}
        confirmClear={confirmClear}
        onClose={() => { if (confirmClear) setConfirmClear(false); else closeDialog() }}
        onPauseResume={pauseResume}
        onStartClear={() => { setConfirmClear(true) }}
        onCancelClear={() => { setConfirmClear(false) }}
        onConfirmClear={confirmAndClear}
        locale={locale}
        t={t}
      />
    </div>
  )
}
