import { WebSocketServer, WebSocket } from 'ws'
import crypto from 'node:crypto'
import type { EnvConfig, GatewayFrame, ConnectParams, GatewayNode, GatewaySession, SwarmClawAgent } from './types.ts'
import { SwarmClawClient } from './swarmclaw-client.ts'

interface ConnectedClient {
  ws: WebSocket
  id: string
  authenticated: boolean
  deviceId?: string
  role?: string
  scopes?: string[]
}

export class GatewayServer {
  private wss: WebSocketServer
  private clients: Map<string, ConnectedClient> = new Map()
  private swarmclaw: SwarmClawClient
  private seqCounter = 0
  private tickInterval: ReturnType<typeof setInterval> | null = null
  private syncInterval: ReturnType<typeof setInterval> | null = null
  private agentStatuses: Map<string, string> = new Map()
  private config: EnvConfig

  constructor(config: EnvConfig, swarmclaw: SwarmClawClient) {
    this.config = config
    this.swarmclaw = swarmclaw
    this.wss = new WebSocketServer({ port: config.gatewayBridgePort })
  }

  private nextSeq(): number {
    return ++this.seqCounter
  }

  private send(client: ConnectedClient, frame: GatewayFrame) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(frame))
    }
  }

  private broadcast(frame: GatewayFrame) {
    const msg = JSON.stringify(frame)
    for (const client of this.clients.values()) {
      if (client.authenticated && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(msg)
      }
    }
  }

  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex')
  }

  private getOrCreateClientId(): string {
    return `gateway-${crypto.randomUUID().slice(0, 8)}`
  }

  private buildNodeFromAgent(agent: SwarmClawAgent): GatewayNode {
    const isCoordinator = agent.role === 'coordinator' || agent.orchestratorEnabled
    const status = agent.status as GatewayNode['status'] || 'offline'

    return {
      id: agent.id,
      name: agent.name,
      type: isCoordinator ? 'coordinator' : 'worker',
      status,
      parentId: agent.orgChart?.parentId ?? null,
      metadata: {
        provider: agent.provider,
        model: agent.model,
        emoji: agent.emoji || null,
        description: agent.description,
        delegationEnabled: agent.delegationEnabled ?? false,
        orchestratorEnabled: agent.orchestratorEnabled ?? false,
        tools: agent.tools || [],
        updatedAt: agent.updatedAt,
      },
    }
  }

  private buildSessionsFromAgents(agents: SwarmClawAgent[]): GatewaySession[] {
    return agents.map(a => ({
      key: `agent:${a.id}:main`,
      agentId: a.id,
      kind: a.role === 'coordinator' ? 'orchestrator' : 'worker',
      model: a.model,
      active: !a.trashedAt,
      updatedAt: a.updatedAt,
      messageCount: 0,
    }))
  }

  private emitTick() {
    const agents = this.swarmclaw.getCachedAgents()
    const nodes = agents.map(a => this.buildNodeFromAgent(a))
    const sessions = this.buildSessionsFromAgents(agents)

    this.broadcast({
      type: 'event',
      event: 'tick',
      seq: this.nextSeq(),
      payload: {
        snapshot: {
          nodes,
          sessions,
          timestamp: Date.now(),
          gateway: {
            name: 'SwarmClaw Bridge',
            version: '1.0.0',
            agentsCount: nodes.length,
            sessionsCount: sessions.length,
          },
        },
      },
    })
  }

  private emitLog(level: string, message: string, session?: string) {
    this.broadcast({
      type: 'event',
      event: 'log',
      seq: this.nextSeq(),
      payload: {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        level,
        source: 'swarmclaw-bridge',
        session,
        message,
      },
    })
  }

  private async checkAgentStatusChanges(prevAgents: SwarmClawAgent[], currentAgents: SwarmClawAgent[]) {
    const prevMap = new Map(prevAgents.map(a => [a.id, a]))
    for (const agent of currentAgents) {
      const prev = prevMap.get(agent.id)
      const newStatus = agent.status || 'offline'
      const oldStatus = this.agentStatuses.get(agent.id) || 'offline'

      if (newStatus !== oldStatus) {
        this.agentStatuses.set(agent.id, newStatus)
        this.broadcast({
          type: 'event',
          event: 'agent.status',
          seq: this.nextSeq(),
          payload: {
            id: agent.id,
            name: agent.name,
            status: newStatus,
            last_seen: agent.updatedAt,
            last_activity: agent.description,
          },
        })
      }
    }
  }

  private async syncAgents() {
    try {
      const prevAgents = this.swarmclaw.getCachedAgents()
      const agents = await this.swarmclaw.fetchAgents()
      await this.checkAgentStatusChanges(prevAgents, agents)
      this.emitLog('info', `Synced ${agents.length} agents from SwarmClaw`)
    } catch (err) {
      this.emitLog('error', `Agent sync failed: ${(err as Error).message}`)
    }
  }

  private handleConnect(client: ConnectedClient, params: ConnectParams): Record<string, unknown> {
    const device = params.device
    if (device) {
      client.deviceId = device.id
    }
    client.role = params.role || 'viewer'
    client.scopes = params.scopes || []
    client.authenticated = true

    return {
      ok: true,
      result: {
        protocol: 3,
        server: {
          id: 'swarmclaw-bridge',
          displayName: 'SwarmClaw Gateway Bridge',
          version: '1.0.0',
        },
        deviceToken: `device-token-${crypto.randomUUID()}`,
        deviceId: device?.id,
      },
    }
  }

  private async handleRpc(client: ConnectedClient, frame: GatewayFrame): Promise<GatewayFrame | null> {
    const { id: frameId, method, params } = frame

    if (!client.authenticated && method !== 'connect') {
      return {
        type: 'res',
        id: frameId,
        ok: false,
        error: { message: 'Not authenticated', code: 'unauthenticated' },
      }
    }

    switch (method) {
      case 'ping': {
        return {
          type: 'res',
          id: frameId,
          ok: true,
          result: { pong: true, timestamp: Date.now() },
        }
      }

      case 'connect': {
        const result = this.handleConnect(client, params as ConnectParams)
        this.emitLog('info', `Client connected: ${client.id} (role: ${client.role})`)
        return {
          type: 'res',
          id: frameId,
          ...result,
        } as GatewayFrame
      }

      case 'node.list': {
        const agents = this.swarmclaw.getCachedAgents()
        const nodes = agents.map(a => this.buildNodeFromAgent(a))

        return {
          type: 'res',
          id: frameId,
          ok: true,
          result: { nodes },
        }
      }

      case 'node.pair.list': {
        const agents = this.swarmclaw.getCachedAgents()
        const pairs = agents
          .filter(a => a.orgChart?.parentId)
          .map(a => ({
            parent: a.orgChart!.parentId,
            child: a.id,
            label: a.orgChart?.teamLabel || undefined,
          }))

        return {
          type: 'res',
          id: frameId,
          ok: true,
          result: { pairs },
        }
      }

      case 'sessions.list': {
        const agents = this.swarmclaw.getCachedAgents()
        const sessions = this.buildSessionsFromAgents(agents)

        return {
          type: 'res',
          id: frameId,
          ok: true,
          result: { sessions },
        }
      }

      case 'device.pair.list': {
        return {
          type: 'res',
          id: frameId,
          ok: true,
          result: { pairs: [] },
        }
      }

      case 'system-presence': {
        const agents = this.swarmclaw.getCachedAgents()
        return {
          type: 'res',
          id: frameId,
          ok: true,
          result: {
            nodes: agents.length,
            sessions: agents.length,
            uptime: process.uptime(),
            version: '1.0.0',
          },
        }
      }

      case 'environments.list': {
        return {
          type: 'res',
          id: frameId,
          ok: true,
          result: {
            environments: [
              {
                id: 'default',
                name: 'SwarmClaw',
                status: 'active',
                agentsCount: this.swarmclaw.getCachedAgents().length,
              },
            ],
          },
        }
      }

      case 'config.get': {
        return {
          type: 'res',
          id: frameId,
          ok: true,
          result: {
            reloadMode: 'hot',
            name: 'SwarmClaw Bridge',
          },
        }
      }

      default: {
        return {
          type: 'res',
          id: frameId,
          ok: false,
          error: { message: `Unknown method: ${method}` },
        }
      }
    }
  }

  start() {
    this.wss.on('connection', (ws: WebSocket) => {
      const client: ConnectedClient = {
        ws,
        id: this.getOrCreateClientId(),
        authenticated: false,
      }
      this.clients.set(client.id, client)

      const clientNonce = this.generateNonce()

      this.send(client, {
        type: 'event',
        event: 'connect.challenge',
        payload: { nonce: clientNonce },
      })

      ws.on('message', async (raw) => {
        try {
          const frame = JSON.parse(String(raw)) as GatewayFrame

          if (frame.type === 'req') {
            const response = await this.handleRpc(client, frame)
            if (response) {
              this.send(client, response)

              if (response.ok && frame.method === 'connect') {
                this.emitLog('info', `Client ${client.id} handshake complete (role: ${client.role})`)
              }
            }
          }
        } catch (err) {
          this.send(client, {
            type: 'res',
            ok: false,
            error: { message: `Parse error: ${(err as Error).message}` },
          })
        }
      })

      ws.on('close', () => {
        this.clients.delete(client.id)
        this.emitLog('info', `Client disconnected: ${client.id}`)
      })

      ws.on('error', (err) => {
        this.clients.delete(client.id)
        this.emitLog('error', `WebSocket error: ${err.message}`)
      })
    })

    this.wss.on('error', (err) => {
      console.error('WebSocket server error:', err)
    })

    this.tickInterval = setInterval(() => {
      if (this.clients.size > 0) {
        this.emitTick()
      }
    }, 3000)

    this.syncInterval = setInterval(() => {
      this.syncAgents()
    }, this.config.agentSyncIntervalMs)

    this.syncAgents()

    console.log(`Gateway bridge listening on ws://0.0.0.0:${this.config.gatewayBridgePort}`)
  }

  stop() {
    if (this.tickInterval) clearInterval(this.tickInterval)
    if (this.syncInterval) clearInterval(this.syncInterval)

    for (const client of this.clients.values()) {
      client.ws.close(1001, 'Server shutting down')
    }
    this.clients.clear()
    this.wss.close()
  }
}
