# dsh-grok-goals

An out-of-tree DeepSeek Harness RC8 plugin that replaces the effective Goal command, tools, prompt policy, durable state, and composer dock for root agents with a host-owned behavioral port of Grok Build’s Goal loop.

This is not a byte-for-byte Rust transplant. The implementation preserves Grok Goal’s control semantics while using Harness’s public Cordis, Agent, Storage Domain, Connection RPC, Tool, Command, Subagent, Session Projection read-side, and Client Slot extension points.

## Behavior

- Runs a fail-closed planner before implementation.
- Replaces the current Grok goal when `/goal <objective>` or authorized `create_goal` starts a new one, matching Grok Build’s last-wins setup behavior.
- Evaluates every completed worker round with a hidden host controller.
- Treats worker completion and blocking claims as advisory.
- Requires an adversarial verifier panel before completion.
- Uses Grok’s staged skeptic-0 reject gate and Variant-C cold-panel quorum.
- Converts malformed or failed skeptic runs into synthetic refutations.
- Pauses on all-verifier infrastructure failure instead of completing.
- Applies repeated-blocker, verifier-cap, identical-gap stall, strategist, and token-budget policies.
- Keeps token usage as a positive-delta parent counter plus auxiliary/subagent spend, with a high-water mark across compaction drops.
- Persists whole Grok Goal snapshots in a lifecycle-fenced Storage Domain sidecar, outside the canonical Session log.
- Serves current state to the dock through a loopback-only Connection RPC channel.
- Pauses active restored goals until a human resumes them.

The native Harness Goal service remains installed but dormant for participating root agents. Agent-scoped `/goal`, `create_goal`, `get_goal`, `update_goal`, and `tool:goal` registrations shadow the shipped registrations. The client occupies the existing `conversation.input.dock` cell with `id: goal` at a lower shadowing priority.

## Commands

```text
/goal <objective> [--budget <tokens>]
/goal status
/goal pause
/goal resume
/goal clear
```

Only a trailing, standalone, positive all-digit `--budget` value is consumed. Malformed or in-sentence budget text remains part of the objective, matching Grok Build’s grammar.

The Goal dock exposes status, objective, token usage, pause/resume, and a responsive details dialog containing the frozen plan, todos, verifier gaps, strategist note, recent history, and completion summary. Clear requires an explicit confirmation.

## Configuration

```yaml
# dshx.yml / Cordis config shape
classifierMaxRuns: 10
verifierCount: 3
strategistEvery: 5
enabled: true
```

`verifierCount` is clamped by validation to 1–5. Defaults mirror the ported behavior: ten verifier attempts, three skeptics, and a strategist trigger every five consecutive rejected verifications.

## Build and test

```sh
pnpm install --ignore-workspace
pnpm test
pnpm build
dshx check dsh-grok-goals
```

The generated `tsdown.config.ts` must continue using dshx’s `externalClientBundle`; RC8’s repository-internal client bundler does not accept out-of-tree `my-plugins/*` entries.

## Compatibility notes

- The custom engine owns a Storage Domain sidecar keyed by Session lifecycle identity rather than mutating Harness core or the shipped `goal` projection.
- RC8 has no public registration seam for durable out-of-repo Session event types, so this plugin deliberately does not append custom events to the canonical Session log. The dock reads the sidecar through Connection RPC.
- Harness’s hard-wired composer command hint still reads the native `goal` projection. The `/goal` command and custom dock are authoritative, but that specific hint is an adapter difference.
- Completion summaries are persisted and shown in the Goal details dialog. The current public extension seam does not directly inject a synthetic assistant message, so the existing worker response remains the chat’s last assistant message.
- Grok Build scratch-file layouts and resumable skeptic process identities are represented through sidecar snapshots and fresh structured subagents rather than copied literally.

See `DESIGN.md` for the UI contract and `THIRD_PARTY_NOTICES.md` for the Apache-2.0 source attribution.
