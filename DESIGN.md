---
version: alpha
name: DSH Grok Goals
description: A compact DeepSeek Harness goal dock and detail dialog backed by a Grok Build-style host-owned goal engine.
colors:
  primary: "var(--dsw-alias-state-business-primary)"
  secondary: "var(--dsw-alias-label-secondary)"
  tertiary: "var(--dsw-alias-label-tertiary)"
  neutral: "var(--dsw-alias-border-l1)"
  surface: "var(--dsw-alias-bg-layer-2)"
  on-surface: "var(--dsw-alias-label-primary)"
  error: "var(--dsw-alias-state-error-primary)"
typography:
  headline-lg:
    fontFamily: inherit
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
  body-md:
    fontFamily: inherit
    fontSize: 13px
    fontWeight: 400
    lineHeight: 20px
  label-md:
    fontFamily: inherit
    fontSize: 12px
    fontWeight: 500
    lineHeight: 18px
rounded:
  none: 0px
  sm: 6px
  md: 12px
  lg: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  goal-dock:
    backgroundColor: "var(--dsw-specific-tip)"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.md}"
    padding: "{spacing.sm}"
  goal-dialog:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.lg}"
---

# Design system

## Overview

This plugin belongs inside the existing DSH WebUI. It should read as a denser, more informative version of the shipped Goal strip, not as a separate product or a Grok-themed skin. The user is coding in a long-running session and needs a quick answer to four questions: what is the objective, is the engine working or waiting, how much budget remains, and what evidence still blocks completion.

## Colors

Use DSH semantic CSS variables only. Status text must always include a written label; color is secondary. Do not add a custom Grok palette or gradients.

## Typography

Keep the inherited DSH font stack. Use 13px for the dock and 12px to 14px in the detail view. Objective text may truncate in the dock, but the dialog must show it in full and wrap mixed Chinese and English safely.

## Layout

The dock shadows the shipped `conversation.input.dock` goal cell and keeps the same width, 36px rhythm, and composer clearances. The detail dialog may grow to 720px on desktop and must collapse to the viewport width on narrow screens. Long plans, verifier findings, and history scroll inside the dialog rather than expanding the page.

## Elevation & Depth

Reuse the shipped `Modal` mask, border, and shadow. Inside the dialog, separate sections with spacing and subtle borders before adding nested cards.

## Shapes

Use 12px for the dock, 24px for the modal, 6px to 8px for compact controls, and full rounding only for status chips and icon buttons.

## Components

### Goal dock

- Shows status, objective, token usage, and verification activity.
- Clicking the main summary opens details.
- Pause or resume and clear remain visible actions.
- Async actions show a busy state and inline failure text.

### Goal detail dialog

- Shows objective, status and phase, token budget, elapsed time, planner contract, current todo progress, verifier gaps, strategist note, and recent history.
- `Escape` and the close button dismiss it.
- Destructive clear requires confirmation in the dialog before dispatch.

## Do's and Don'ts

- Do preserve the shipped composer geometry and semantic color tokens.
- Do make completion authority explicit: verification, not the worker's prose, ends a goal.
- Do show actionable gaps in plain language.
- Don't duplicate the existing Todo dock inside the composer stack. Todos belong in the expanded detail view.
- Don't rely on hover, color, or animation for critical state.
- Don't introduce an app-shell dependency.

## Request Anchor

- Original user request: Replace DeepSeek Harness Goal with the Grok Build Goal experience, adapt the UI, and use Grok Build's goal logic underneath.
- Latest user override: Complete development and browser verification on the isolated Host at port 43128; request only one final DSH.app restart after the implementation passes.
- Deliverable: A file-backed Creator Mode+ plugin that shadows the shipped goal UI and host behavior without editing Harness core or shipped presets.
- Primary audience: The current DSH WebUI user running long coding tasks.
- Core job to be done: Start an autonomous goal, watch its plan and evidence loop, pause or resume it, and trust that completion happens only after adversarial verification.
- Success criteria: `/goal` uses the plugin engine; scoped model tools no longer activate the native DSH goal driver; the UI exposes Grok-style status, budget, plan, verifier gaps, and history; build, activation, and browser verification pass.
- Non-goals: Re-skinning the whole WebUI; modifying DSH core; embedding the Grok TUI; reproducing Grok's terminal renderer pixel-for-pixel.
- Must preserve: DSH session durability, existing conversation and Todo flows, public Cordis/client extension points, keyboard access, and HMR/build contracts.
- Validation must check against: command shadowing, tool shadowing, host-owned continuation, verifier-only completion, pause/resume/clear semantics, token budget behavior, narrow layout, focus and accessible names.

## Content Model

- User intent: Understand and control one long-running goal without reading the full transcript.
- Message hierarchy: status and objective, current phase, budget and elapsed time, next step, verifier gaps, plan and history.
- First-screen answers: what is running, whether it is paused or verifying, and how to inspect or stop it.
- Primary action meaning: pause stops automatic continuation; resume resets auto-pause counters and starts work again; clear removes the plugin goal after confirmation.
- Voice and tone: compact, technical, direct.
- Terminology rules: use Goal, Planning, Executing, Verifying, Paused, Blocked, Budget limited, Complete, verifier gap, and token budget consistently.
- State language rules: errors name what failed and whether the goal paused; empty plan or gaps explain why rather than showing blank containers.
- Trust, risk, and help content: state that the worker cannot self-complete and that verifier infrastructure failure pauses rather than passes.
- Content risks: long objectives and verifier findings, mixed Chinese and English, and potentially sensitive workspace details. Keep the dock terse and the detail view session-local.

## OKF Preflight

### Active OKF Concepts

- `design-okf/digital/accessibility-usability.md`
- `design-okf/digital/responsive-interaction.md`

### Support References

- `branch-web-product.md`
- `content-model.md`
- `design-okf/governance/request-integrity.md`
- `design-contract.md`
- `visual-verification.md`
- `quality-gates.md`

### Execution Mode

- `single-agent`: one writer owns the plugin and contract; background agents only supplied source analysis.

### Decision Record

- Constraints extracted: use semantic HTML, visible focus, written status labels, Escape-close behavior, async feedback, no 320px horizontal overflow, and no fixed UI covering content.
- Deliberate exceptions: the dock keeps 28px icon actions to match the shipped composer controls; the larger confirmation action in the dialog uses a comfortable target.
- Verification hooks: typecheck and focused tests for state transitions; live WebUI checks at desktop and narrow widths; keyboard and dialog semantics inspection.

## OKF Decision Bindings

| Reference | Decision | Artifact target | Verification |
|---|---|---|---|
| `design-okf/digital/accessibility-usability.md` | Use real buttons, accessible names, visible focus, written status, confirmation before clear, and recoverable async errors. | Goal dock and detail dialog | Component tests plus live accessibility-tree and keyboard review. |
| `design-okf/digital/responsive-interaction.md` | Keep the dock single-line, move dense data into a responsive scrollable dialog, and prevent fixed overlay occlusion. | Dock CSS and modal CSS | Live desktop and narrow viewport screenshots and interaction checks. |

## Information Architecture

- Core user tasks: create or inspect a goal, monitor progress, inspect verification gaps, pause, resume, clear.
- Screen inventory: composer goal dock and one expanded modal.
- Navigation model: dock summary opens the modal; modal close returns focus to the conversation.
- Content hierarchy: status and objective first, then budget/phase, then actionable next step and gaps, then plan/history.
- Primary CTA rules: the state-changing action is pause or resume; clear remains secondary and destructive.

## Taste Signature

- Design read: quiet operations console inside the existing DSH composer.
- Category defaults kept: compact status strip, semantic tokens, icon actions.
- Category defaults rejected: nested dashboard cards, custom gradients, branded chrome, decorative motion.
- Layout-family budget: one dock strip and one modal, no extra side panel.
- Visual memory feature: a slim token-budget rail paired with the verifier state label.
- Type personality: inherited DSH utility typography.

## Assumptions

- The active profile includes the public `spawn` and `fork` subagent providers, token/session projection readers, Storage Domain, and Connection services from the base bundle.
- Whole Grok Goal snapshots live in a lifecycle-fenced Storage Domain row; the canonical Session log remains free of downstream event types so cold reload stays compatible with RC8.
- The dock reads current Goal state through a loopback-only Connection RPC channel and treats the shell as the owner of connection-state feedback.
- Grok Build behavior is ported from official source at commit `19d42e35c07a9c9244f03f6df0c4c353f970d4f9`; storage and transport follow DSH public interfaces.

## Open Questions

- None block the first implementation. Per-role model selection and persistent skeptic-0 resume can remain configurable follow-up fidelity if the host's public subagent contract makes them costly.

## Review Log

- 2026-08-21: Bootstrapped the contract before implementation from the user request, DSH Goal UI, public slot/command/tool seams, and Grok Build source behavior.
- 2026-08-22: Cold-reload testing on the isolated Host exposed RC8's refusal of unknown downstream Session event types. Replaced custom `grok-goal/change` events with an atomic Storage Domain sidecar and loopback-only Connection RPC; the canonical Session log is no longer extended.
- 2026-08-22: Isolated acceptance on port 43128 passed the full 23-test build, dshx static checks, pause-during-planning race, destructive clear, last-wins replacement, desktop dialog focus/controls, 390px responsive layout, cold history reload, restart safety pause, and post-restart resume. Both diagnostic sessions were archived after verification.
- 2026-08-22: Formal activation on port 43127 reached `HOST_TREE_ACTIVE` and `CLIENT_MANIFEST_PRESENT`; a freshly reloaded WebUI fetched the exact client revision, rendered the custom dock, completed a real `/goal` command without history errors, then cleared its sidecar state. The disposable formal acceptance session was archived.
