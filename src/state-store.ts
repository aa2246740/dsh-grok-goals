import type { Context } from '@deepseek-ai/cordis'
import type { Session, SessionId } from '@deepseek-ai/dsh-session'
import {
  defineDomain,
  domainTable,
  type Domain,
  type KvTable,
} from '@deepseek-ai/dsh-storage-domain'
import { z } from 'zod'
import {
  grokGoalSnapshotSchema,
  type GrokGoalProjection,
  type GrokGoalSnapshot,
} from './types.js'

const goalStateRecordSchema = z.object({
  sessionCreatedAt: z.number().int().nonnegative(),
  sessionCwd: z.string().nullable(),
  goal: grokGoalSnapshotSchema.nullable(),
})

type GoalStateRecord = z.infer<typeof goalStateRecordSchema>

const goalStateDomainSpec = defineDomain({
  name: 'dsh_grok_goals',
  version: 1,
  tables: {
    sessions: domainTable<SessionId, GoalStateRecord>(goalStateRecordSchema),
  },
})

function recordFor(session: Session, goal: GrokGoalProjection): GoalStateRecord {
  return {
    sessionCreatedAt: session.header.createdAt,
    sessionCwd: session.header.cwd ?? null,
    goal,
  }
}

function sameLifecycle(session: Session, record: GoalStateRecord): boolean {
  return record.sessionCreatedAt === session.header.createdAt
    && record.sessionCwd === (session.header.cwd ?? null)
}

/**
 * Durable per-session Grok goal sidecar.
 *
 * RC8 intentionally has no public registration seam for out-of-repo session
 * event types. Keeping snapshots in a storage domain preserves canonical
 * Session reload compatibility while retaining whole-state CAS semantics.
 */
export class GrokGoalStateStore {
  private constructor(
    private readonly domain: Domain<typeof goalStateDomainSpec>,
    private readonly table: KvTable<SessionId, GoalStateRecord>,
  ) {}

  static async open(ctx: Context): Promise<GrokGoalStateStore> {
    const domain = await ctx.storageDomain.open(goalStateDomainSpec)
    return new GrokGoalStateStore(domain, domain.table('sessions'))
  }

  get(session: Session): GrokGoalProjection {
    const record = this.table.get(session.id)
    return record !== undefined && sameLifecycle(session, record) ? record.goal : null
  }

  async put(session: Session, goal: GrokGoalSnapshot): Promise<void> {
    await this.table.put(session.id, recordFor(session, goal))
  }

  async commit(
    session: Session,
    previous: GrokGoalSnapshot,
    next: GrokGoalSnapshot,
  ): Promise<boolean> {
    let committed = false
    await this.table.update(session.id, (current) => {
      if (!sameLifecycle(session, current)
        || current.goal === null
        || current.goal.goalId !== previous.goalId
        || current.goal.revision !== previous.revision) {
        return current
      }
      committed = true
      return recordFor(session, next)
    })
    return committed
  }

  async clear(session: Session, previous: GrokGoalSnapshot): Promise<boolean> {
    let cleared = false
    await this.table.update(session.id, (current) => {
      if (!sameLifecycle(session, current)
        || current.goal === null
        || current.goal.goalId !== previous.goalId
        || current.goal.revision !== previous.revision) {
        return current
      }
      cleared = true
      return recordFor(session, null)
    })
    return cleared
  }

  async close(): Promise<void> {
    await this.domain.close()
  }
}
