import type { SwarmClawAgent, EnvConfig } from './types.ts'

export class SwarmClawClient {
  private baseUrl: string
  private apiKey: string
  private agentCache: Map<string, SwarmClawAgent> = new Map()

  constructor(config: EnvConfig) {
    this.baseUrl = config.swarmclawApiUrl.replace(/\/+$/, '')
    this.apiKey = config.swarmclawApiKey
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }
    if (this.apiKey && this.apiKey !== 'auto') {
      headers['x-access-key'] = this.apiKey
    }

    const res = await fetch(url, { ...options, headers, signal: AbortSignal.timeout(10000) })
    if (!res.ok) {
      throw new Error(`SwarmClaw API ${res.status}: ${res.statusText}`)
    }
    return res.json() as Promise<T>
  }

  async fetchAgents(): Promise<SwarmClawAgent[]> {
    const data = await this.request<Record<string, unknown>>('/api/agents?limit=200')

    let agents: SwarmClawAgent[]
    if ('items' in data && Array.isArray(data.items)) {
      agents = data.items as SwarmClawAgent[]
    } else {
      agents = Object.values(data).filter((v): v is SwarmClawAgent => typeof v === 'object' && v !== null && 'id' in v)
    }

    for (const agent of agents) {
      if (!agent.trashedAt) {
        this.agentCache.set(agent.id, agent)
      } else {
        this.agentCache.delete(agent.id)
      }
    }

    return agents.filter(a => !a.trashedAt)
  }

  async fetchAgent(id: string): Promise<SwarmClawAgent | null> {
    try {
      const agent = await this.request<SwarmClawAgent>(`/api/agents/${id}`)
      if (!agent.trashedAt) {
        this.agentCache.set(agent.id, agent)
      }
      return agent.trashedAt ? null : agent
    } catch {
      return this.agentCache.get(id) ?? null
    }
  }

  getCachedAgents(): SwarmClawAgent[] {
    return Array.from(this.agentCache.values()).filter(a => !a.trashedAt)
  }

  getCachedAgent(id: string): SwarmClawAgent | undefined {
    const agent = this.agentCache.get(id)
    return agent?.trashedAt ? undefined : agent
  }

  async checkHealth(): Promise<boolean> {
    try {
      await this.request<unknown>('/api/healthz')
      return true
    } catch {
      return false
    }
  }
}
