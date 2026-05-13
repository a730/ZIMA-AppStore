export interface EnvConfig {
  swarmclawApiUrl: string
  swarmclawApiKey: string
  gatewayBridgePort: number
  agentSyncIntervalMs: number
}

export interface SwarmClawAgent {
  id: string
  name: string
  description: string
  provider: string
  model: string
  role: 'worker' | 'coordinator'
  delegationEnabled?: boolean
  orchestratorEnabled?: boolean
  status?: string
  emoji?: string
  soul?: string
  systemPrompt: string
  tools?: string[]
  orgChart?: {
    parentId?: string | null
    teamLabel?: string | null
  }
  updatedAt: number
  createdAt: number
  trashedAt?: number | null
}

export interface GatewayNode {
  id: string
  name: string
  type: 'agent' | 'coordinator' | 'worker'
  status: 'online' | 'idle' | 'busy' | 'offline' | 'error'
  metadata: Record<string, unknown>
  parentId?: string | null
  children?: string[]
}

export interface GatewaySession {
  key: string
  agentId: string
  kind: string
  model?: string
  active: boolean
  updatedAt: number
  messageCount?: number
  totalTokens?: number
  contextTokens?: number
  cost?: number
}

export interface GatewayFrame {
  type: 'req' | 'res' | 'event'
  id?: string
  method?: string
  event?: string
  params?: Record<string, unknown>
  payload?: unknown
  result?: unknown
  ok?: boolean
  error?: { message?: string; code?: string; details?: unknown }
  seq?: number
}

export interface ConnectParams {
  minProtocol?: number
  maxProtocol?: number
  client?: {
    id: string
    displayName: string
    version: string
    platform: string
    mode?: string
  }
  role?: string
  scopes?: string[]
  auth?: { token: string }
  device?: {
    id: string
    publicKey: string
    signature: string
    signedAt: number
    nonce: string
  }
  deviceToken?: string
}
