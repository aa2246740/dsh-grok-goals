import { useEffect, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { IconChevronDownOutline14 } from '@deepseek-ai/dsh-client-ui-primitives'
import type { SettingsScope } from '@deepseek-ai/dsh-client-ui-settings/client'
import type { GrokGoalSettings } from '../settings-contract.js'
import css from './GrokGoalSettings.module.css'

export interface GrokGoalSettingsInjected {
  readonly scope: SettingsScope<GrokGoalSettings>
  readonly locale: string
}

type SettingsCopy = {
  readonly title: string
  readonly description: string
  readonly expand: string
  readonly collapse: string
  readonly unsaved: string
  readonly readOnly: string
  readonly unlimited: string
  readonly unlimitedHint: string
  readonly defaultBudget: string
  readonly defaultBudgetHint: string
  readonly classifierMaxRuns: string
  readonly classifierHint: string
  readonly verifierCount: string
  readonly verifierHint: string
  readonly strategistEvery: string
  readonly strategistHint: string
  readonly invalidBudget: string
  readonly discard: string
  readonly save: string
  readonly saving: string
  readonly saveFailed: string
}

type Draft = {
  unlimited: boolean
  defaultTokenBudget: string
  classifierMaxRuns: string
  verifierCount: string
  strategistEvery: string
}

function copy(locale: string): SettingsCopy {
  return locale.startsWith('zh')
    ? {
      title: 'Grok Goals',
      description: '新建 Goal 的默认 token 预算。',
      expand: '展开',
      collapse: '收起',
      unsaved: '未保存',
      readOnly: '当前连接不能改这些设置。',
      unlimited: '默认不限制 token',
      unlimitedHint: '关掉后，新建 Goal 才用下面的上限。',
      defaultBudget: '默认 token 上限',
      defaultBudgetHint: '/goal --budget 仍只覆盖这一次。',
      classifierMaxRuns: '验证尝试上限',
      classifierHint: '完成前最多跑几轮对抗验证。',
      verifierCount: '对抗验证器数量',
      verifierHint: '1 到 5。',
      strategistEvery: 'strategist 间隔',
      strategistHint: '连续未通过这么多次后再请 strategist。',
      invalidBudget: '请输入大于 0 的整数。',
      discard: '放弃',
      save: '保存',
      saving: '保存中',
      saveFailed: '保存失败，请再试一次。',
    }
    : {
      title: 'Grok Goals',
      description: 'Default token budget for new goals.',
      expand: 'Expand',
      collapse: 'Collapse',
      unsaved: 'Unsaved',
      readOnly: 'This connection cannot change these settings.',
      unlimited: 'Unlimited tokens by default',
      unlimitedHint: 'The cap below applies only after this is turned off.',
      defaultBudget: 'Default token cap',
      defaultBudgetHint: '/goal --budget still overrides one goal.',
      classifierMaxRuns: 'Verifier attempt cap',
      classifierHint: 'How many adversarial verifier rounds may run before completion.',
      verifierCount: 'Adversarial verifier count',
      verifierHint: 'From 1 through 5.',
      strategistEvery: 'Strategist interval',
      strategistHint: 'Ask the strategist after this many consecutive misses.',
      invalidBudget: 'Enter an integer greater than 0.',
      discard: 'Discard',
      save: 'Save',
      saving: 'Saving',
      saveFailed: 'Save failed. Try again.',
    }
}

function parsePositiveInt(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d+$/.test(trimmed)) return null
  const value = Number(trimmed)
  return Number.isSafeInteger(value) && value > 0 ? value : null
}

function draftFrom(settings: GrokGoalSettings): Draft {
  return {
    unlimited: settings.unlimitedTokenBudget !== false,
    defaultTokenBudget: String(settings.defaultTokenBudget ?? 200_000),
    classifierMaxRuns: String(settings.classifierMaxRuns ?? 10),
    verifierCount: String(settings.verifierCount ?? 3),
    strategistEvery: String(settings.strategistEvery ?? 5),
  }
}

export function GrokGoalSettingsCard(props: Partial<GrokGoalSettingsInjected>): ReactNode {
  const scope = props.scope
  const locale = props.locale ?? 'en'
  if (scope === undefined) return null
  return <LoadedCard scope={scope} locale={locale} />
}

function LoadedCard({ scope, locale }: GrokGoalSettingsInjected): ReactNode {
  const text = copy(locale)
  const snapshot = useSyncExternalStore(
    listener => scope.subscribe(listener),
    () => scope.getSnapshot(),
  )
  const settings = snapshot.value
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (settings === undefined) return
    setDraft(draftFrom(settings))
    setFailed(false)
  }, [settings])

  if (snapshot.status !== 'ready' || settings === undefined || draft === null) return null

  const current = draftFrom(settings)
  const dirty = draft.unlimited !== current.unlimited
    || draft.defaultTokenBudget !== current.defaultTokenBudget
    || draft.classifierMaxRuns !== current.classifierMaxRuns
    || draft.verifierCount !== current.verifierCount
    || draft.strategistEvery !== current.strategistEvery
  const budget = parsePositiveInt(draft.defaultTokenBudget)
  const classifier = parsePositiveInt(draft.classifierMaxRuns)
  const verifier = parsePositiveInt(draft.verifierCount)
  const strategist = parsePositiveInt(draft.strategistEvery)
  const verifierOk = verifier !== null && verifier <= 5
  const invalid = (!draft.unlimited && budget === null)
    || classifier === null
    || !verifierOk
    || strategist === null
  const disabled = !snapshot.writable || saving

  const save = async (): Promise<void> => {
    if (invalid || !dirty) return
    setSaving(true)
    setFailed(false)
    try {
      if (draft.unlimited !== current.unlimited) await scope.set('unlimitedTokenBudget', draft.unlimited)
      if (budget !== Number(current.defaultTokenBudget)) await scope.set('defaultTokenBudget', budget)
      if (classifier !== Number(current.classifierMaxRuns)) await scope.set('classifierMaxRuns', classifier)
      if (verifier !== Number(current.verifierCount)) await scope.set('verifierCount', verifier)
      if (strategist !== Number(current.strategistEvery)) await scope.set('strategistEvery', strategist)
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <li className={open ? `${css.card} ${css.cardOpen}` : css.card} data-ud-check="grok-goal-settings">
      <button
        type="button"
        className={css.header}
        aria-expanded={open}
        aria-label={`${open ? text.collapse : text.expand}: ${text.title}`}
        onClick={() => { setOpen(!open) }}
      >
        <span className={css.headText}>
          <span className={css.name}>{text.title}</span>
          <span className={css.description}>{text.description}</span>
        </span>
        {dirty ? <span className={css.pending}>{text.unsaved}</span> : null}
        <IconChevronDownOutline14 className={open ? `${css.chevron} ${css.chevronOpen}` : css.chevron} />
      </button>
      {open
        ? (
          <div className={css.body}>
            {!snapshot.writable ? <p className={css.readOnly} role="status">{text.readOnly}</p> : null}
            <div className={css.field}>
              <label className={css.head}>
                <span className={css.label}>{text.unlimited}</span>
                <input
                  className={css.toggle}
                  type="checkbox"
                  data-ud-check="grok-goal-settings-unlimited"
                  checked={draft.unlimited}
                  disabled={disabled}
                  onChange={event => { setDraft({ ...draft, unlimited: event.target.checked }) }}
                />
              </label>
              <p className={css.hint}>{text.unlimitedHint}</p>
            </div>
            <NumberField
              id="grok-goal-settings-budget"
              label={text.defaultBudget}
              hint={text.defaultBudgetHint}
              invalidLabel={text.invalidBudget}
              value={draft.defaultTokenBudget}
              invalid={budget === null}
              disabled={disabled || draft.unlimited}
              onEdit={value => { setDraft({ ...draft, defaultTokenBudget: value }) }}
            />
            <NumberField
              id="grok-goal-settings-classifier"
              label={text.classifierMaxRuns}
              hint={text.classifierHint}
              invalidLabel={text.invalidBudget}
              value={draft.classifierMaxRuns}
              invalid={classifier === null}
              disabled={disabled}
              onEdit={value => { setDraft({ ...draft, classifierMaxRuns: value }) }}
            />
            <NumberField
              id="grok-goal-settings-verifier"
              label={text.verifierCount}
              hint={text.verifierHint}
              invalidLabel={text.invalidBudget}
              value={draft.verifierCount}
              invalid={!verifierOk}
              disabled={disabled}
              onEdit={value => { setDraft({ ...draft, verifierCount: value }) }}
            />
            <NumberField
              id="grok-goal-settings-strategist"
              label={text.strategistEvery}
              hint={text.strategistHint}
              invalidLabel={text.invalidBudget}
              value={draft.strategistEvery}
              invalid={strategist === null}
              disabled={disabled}
              onEdit={value => { setDraft({ ...draft, strategistEvery: value }) }}
            />
            <div className={css.footer}>
              {failed ? <p className={css.failed} role="status">{text.saveFailed}</p> : null}
              <button
                type="button"
                className={css.discard}
                disabled={!dirty || saving}
                onClick={() => { setDraft(current); setFailed(false) }}
              >
                {text.discard}
              </button>
              <button
                type="button"
                className={css.save}
                disabled={!dirty || invalid || saving || !snapshot.writable}
                onClick={() => { void save() }}
              >
                {saving ? text.saving : text.save}
              </button>
            </div>
          </div>
        )
        : null}
    </li>
  )
}

function NumberField(props: {
  readonly id: string
  readonly label: string
  readonly hint: string
  readonly invalidLabel: string
  readonly value: string
  readonly invalid: boolean
  readonly disabled: boolean
  readonly onEdit: (value: string) => void
}): ReactNode {
  return (
    <div className={css.field}>
      <label className={css.label} htmlFor={props.id}>{props.label}</label>
      <input
        id={props.id}
        className={props.invalid ? css.inputInvalid : css.input}
        type="text"
        inputMode="numeric"
        value={props.value}
        disabled={props.disabled}
        aria-invalid={props.invalid}
        onChange={event => { props.onEdit(event.target.value) }}
      />
      <p className={props.invalid ? css.invalid : css.hint}>
        {props.invalid ? props.invalidLabel : props.hint}
      </p>
    </div>
  )
}
