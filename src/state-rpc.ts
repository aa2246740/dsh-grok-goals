import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { clientRequestSchema } from '@deepseek-ai/dsh-client-connection'
import type { WebRoute } from '@deepseek-ai/dsh-host-webserver'
import { SessionId } from '@deepseek-ai/dsh-session'
import type { GrokGoalStateStore } from './state-store.js'
import {
  GROK_GOAL_RPC_CHANNEL,
  GROK_GOAL_STATE_ENDPOINT,
  parseGrokGoalStateRequest,
} from './wire.js'

const ENDPOINT_SEGMENT = /^[A-Za-z0-9_$.-]+$/
const MAX_RPC_BODY_BYTES = 1_048_576

function endpointFromUrl(url: string | undefined): string | undefined {
  const path = (url ?? '').split('?')[0] ?? ''
  if (!path.startsWith(`${GROK_GOAL_RPC_CHANNEL}/`)) return undefined
  const endpoint = path.slice(GROK_GOAL_RPC_CHANNEL.length + 1)
  const segments = endpoint.split('/')
  if (segments.some(segment => segment === '' || segment === '.' || segment === '..' || !ENDPOINT_SEGMENT.test(segment))) {
    return undefined
  }
  return endpoint
}

function writeRpc(res: ServerResponse, status: number, body: unknown): void {
  const text = typeof body === 'string' ? body : JSON.stringify(body)
  res.writeHead(status, {
    'cache-control': 'no-store',
    'content-type': typeof body === 'string' ? 'text/plain; charset=utf-8' : 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(text),
  })
  res.end(text)
}

/**
 * Dedicated goal RPC is mounted on this plugin fiber's webServer.
 * Connection.rpc.handle registers the same prefix on the Connection fiber,
 * which does not inject webServer in 0.1.5-rc.2.
 */
export function registerGrokGoalStateRpc(ctx: Context, store: GrokGoalStateStore): void {
  const route: WebRoute = {
    kind: 'prefix',
    path: GROK_GOAL_RPC_CHANNEL,
    handler: async (req: IncomingMessage, res: ServerResponse) => {
      const rejection = ctx.connection.requestRejection(req)
      if (rejection !== undefined) {
        res.writeHead(rejection)
        res.end(rejection === 401 ? 'unauthorized' : 'forbidden')
        return
      }
      const endpoint = endpointFromUrl(req.url)
      if (req.method !== 'POST' || endpoint === undefined) {
        writeRpc(res, 404, 'not found')
        return
      }
      const mediaType = req.headers['content-type']?.split(';', 1)[0]?.trim().toLowerCase()
      if (mediaType !== 'application/json') {
        writeRpc(res, 415, 'content type must be application/json')
        return
      }
      const chunks: Buffer[] = []
      let received = 0
      for await (const chunk of req) {
        const buffer = chunk as Buffer
        received += buffer.byteLength
        if (received > MAX_RPC_BODY_BYTES) {
          res.writeHead(413, { connection: 'close' })
          res.end()
          req.destroy()
          return
        }
        chunks.push(buffer)
      }
      let body: unknown
      try {
        body = JSON.parse(Buffer.concat(chunks).toString('utf8'))
      } catch {
        writeRpc(res, 400, 'body is not JSON')
        return
      }
      const envelope = clientRequestSchema.safeParse(body)
      if (!envelope.success) {
        const rawId = (body as { rpcId?: unknown } | null)?.rpcId
        writeRpc(res, 200, {
          type: 'server-response',
          rpcId: typeof rawId === 'string' ? rawId : 'invalid-request',
          result: { ok: false, error: { code: 'gateway/bad-request', message: 'invalid client-request message', details: { issues: envelope.error.issues } } },
        })
        return
      }
      if (envelope.data.method !== endpoint) {
        writeRpc(res, 200, {
          type: 'server-response',
          rpcId: envelope.data.rpcId,
          result: {
            ok: false,
            error: {
              code: 'gateway/bad-request',
              message: `method ${JSON.stringify(envelope.data.method)} does not match endpoint ${JSON.stringify(endpoint)}`,
              details: { issues: [] },
            },
          },
        })
        return
      }
      try {
        if (endpoint !== GROK_GOAL_STATE_ENDPOINT) {
          writeRpc(res, 200, {
            type: 'server-response',
            rpcId: envelope.data.rpcId,
            result: {
              ok: false,
              error: { code: 'bad-request', message: `Unknown Grok goal endpoint: ${endpoint}`, details: { issues: [] } },
            },
          })
          return
        }
        const request = parseGrokGoalStateRequest(envelope.data.payload)
        if (request === null) {
          writeRpc(res, 200, {
            type: 'server-response',
            rpcId: envelope.data.rpcId,
            result: {
              ok: false,
              error: { code: 'bad-request', message: 'Invalid Grok goal state request.', details: { issues: [] } },
            },
          })
          return
        }
        const sessionId = SessionId(request.sessionId)
        const session = ctx.sessions.get(sessionId)
        if (session === undefined) {
          writeRpc(res, 200, {
            type: 'server-response',
            rpcId: envelope.data.rpcId,
            result: {
              ok: false,
              error: { code: 'session-not-found', message: `Session ${sessionId} is not active.`, details: { sessionId } },
            },
          })
          return
        }
        writeRpc(res, 200, {
          type: 'server-response',
          rpcId: envelope.data.rpcId,
          result: { ok: true, value: { goal: store.get(session) } },
        })
      } catch (error: unknown) {
        writeRpc(res, 500, `handler failure: ${String(error)}`)
      }
    },
  }
  ctx.effect(() => ctx.webServer.register(route), 'dsh-grok-goals: RPC channel')
}
