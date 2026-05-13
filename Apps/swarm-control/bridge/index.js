import { WebSocketServer } from 'ws'
import crypto from 'node:crypto'

const SWARMCLAW_API_URL = (process.env.SWARMCLAW_API_URL || 'http://localhost:3456').replace(/\/+$/, '')
const SWARMCLAW_API_KEY = process.env.SWARMCLAW_API_KEY || ''
const PORT = Number(process.env.GATEWAY_BRIDGE_PORT || '18789')
const SYNC_INTERVAL = Number(process.env.AGENT_SYNC_INTERVAL_MS || '5000')

let seqCounter = 0
const clients = new Map()
const agentCache = new Map()
const agentStatuses = new Map()

function nextSeq() { return ++seqCounter }

async function apiFetch(path) {
  const url = `${SWARMCLAW_API_URL}${path}`
  const headers = { 'Content-Type': 'application/json' }
  if (SWARMCLAW_API_KEY && SWARMCLAW_API_KEY !== 'auto') headers['x-access-key'] = SWARMCLAW_API_KEY
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) })
  if (!res.ok) throw new Error(`SwarmClaw API ${res.status}`)
  return res.json()
}

async function fetchAgents() {
  const data = await apiFetch('/api/agents?limit=200')
  let agents = Array.isArray(data.items) ? data.items : Object.values(data).filter(v => v && typeof v === 'object' && v.id)
  for (const a of agents) {
    if (!a.trashedAt) agentCache.set(a.id, a)
    else agentCache.delete(a.id)
  }
  return agents.filter(a => !a.trashedAt)
}

function buildNodes(agents) {
  return agents.map(a => ({
    id: a.id,
    name: a.name,
    type: (a.role === 'coordinator' || a.orchestratorEnabled) ? 'coordinator' : 'worker',
    status: a.status || 'offline',
    parentId: a.orgChart?.parentId || null,
    metadata: {
      provider: a.provider,
      model: a.model,
      emoji: a.emoji || null,
      description: a.description,
      delegationEnabled: !!a.delegationEnabled,
      orchestratorEnabled: !!a.orchestratorEnabled,
    },
  }))
}

function buildSessions(agents) {
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

function broadcast(frame) {
  const msg = JSON.stringify(frame)
  for (const c of clients.values()) {
    if (c.authenticated && c.ws.readyState === 1) c.ws.send(msg)
  }
}

function emitTick() {
  const agents = Array.from(agentCache.values()).filter(a => !a.trashedAt)
  broadcast({
    type: 'event', event: 'tick', seq: nextSeq(),
    payload: {
      snapshot: {
        nodes: buildNodes(agents),
        sessions: buildSessions(agents),
        timestamp: Date.now(),
        gateway: { name: 'SwarmClaw Bridge', version: '1.0.0', agentsCount: agents.length },
      },
    },
  })
}

function emitLog(level, message) {
  broadcast({
    type: 'event', event: 'log', seq: nextSeq(),
    payload: { id: `log-${Date.now()}`, timestamp: Date.now(), level, source: 'swarmclaw-bridge', message },
  })
}

function emitAgentStatus(agent, status) {
  broadcast({
    type: 'event', event: 'agent.status', seq: nextSeq(),
    payload: { id: agent.id, name: agent.name, status, last_seen: agent.updatedAt },
  })
}

async function syncAgents() {
  try {
    const prev = Array.from(agentCache.values()).filter(a => !a.trashedAt)
    const agents = await fetchAgents()
    for (const a of agents) {
      const oldStatus = agentStatuses.get(a.id) || 'offline'
      const newStatus = a.status || 'offline'
      if (newStatus !== oldStatus) {
        agentStatuses.set(a.id, newStatus)
        emitAgentStatus(a, newStatus)
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') emitLog('error', `Sync failed: ${err.message}`)
  }
}

function handleConnect(client, params) {
  const device = params.device
  if (device) client.deviceId = device.id
  client.role = params.role || 'viewer'
  client.scopes = params.scopes || []
  client.authenticated = true
  return {
    ok: true,
    result: {
      protocol: 3,
      server: { id: 'swarmclaw-bridge', displayName: 'SwarmClaw Gateway Bridge', version: '1.0.0' },
      deviceToken: `dt-${crypto.randomUUID()}`,
      deviceId: device?.id,
    },
  }
}

function handleRpc(client, frame) {
  const { id: frameId, method, params } = frame
  if (!client.authenticated && method !== 'connect') {
    return { type: 'res', id: frameId, ok: false, error: { message: 'Not authenticated' } }
  }
  switch (method) {
    case 'ping':
      return { type: 'res', id: frameId, ok: true, result: { pong: true, timestamp: Date.now() } }
    case 'connect':
      emitLog('info', `Client ${client.id} connecting (role: ${params?.role})`)
      return { type: 'res', id: frameId, ...handleConnect(client, params || {}) }
    case 'node.list': {
      const agents = Array.from(agentCache.values()).filter(a => !a.trashedAt)
      return { type: 'res', id: frameId, ok: true, result: { nodes: buildNodes(agents) } }
    }
    case 'sessions.list': {
      const agents = Array.from(agentCache.values()).filter(a => !a.trashedAt)
      return { type: 'res', id: frameId, ok: true, result: { sessions: buildSessions(agents) } }
    }
    case 'node.pair.list': {
      const agents = Array.from(agentCache.values()).filter(a => !a.trashedAt && a.orgChart?.parentId)
      return { type: 'res', id: frameId, ok: true, result: { pairs: agents.map(a => ({ parent: a.orgChart.parentId, child: a.id })) } }
    }
    case 'device.pair.list':
      return { type: 'res', id: frameId, ok: true, result: { pairs: [] } }
    case 'system-presence':
      return { type: 'res', id: frameId, ok: true, result: { nodes: agentCache.size, sessions: agentCache.size, uptime: process.uptime(), version: '1.0.0' } }
    case 'environments.list':
      return { type: 'res', id: frameId, ok: true, result: { environments: [{ id: 'default', name: 'SwarmClaw', status: 'active', agentsCount: agentCache.size }] } }
    default:
      return { type: 'res', id: frameId, ok: false, error: { message: `Unknown method: ${method}` } }
  }
}

// ─── Server ───

const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  const client = { ws, id: `gw-${crypto.randomUUID().slice(0, 8)}`, authenticated: false }
  clients.set(client.id, client)

  ws.send(JSON.stringify({ type: 'event', event: 'connect.challenge', payload: { nonce: crypto.randomBytes(16).toString('hex') } }))

  ws.on('message', (raw) => {
    try {
      const frame = JSON.parse(String(raw))
      if (frame.type === 'req') {
        const res = handleRpc(client, frame)
        if (res) {
          ws.send(JSON.stringify(res))
          if (res.ok && frame.method === 'connect') emitLog('info', `Client ${client.id} handshake complete`)
        }
      }
    } catch (err) {
      ws.send(JSON.stringify({ type: 'res', ok: false, error: { message: `Parse error: ${err.message}` } }))
    }
  })

  ws.on('close', () => { clients.delete(client.id); emitLog('info', `Client disconnected: ${client.id}`) })
  ws.on('error', () => clients.delete(client.id))
})

wss.on('error', (err) => console.error('Server error:', err))

setInterval(() => { if (clients.size > 0) emitTick() }, 3000)
setInterval(() => syncAgents(), SYNC_INTERVAL)
syncAgents()

console.log(`Gateway bridge listening on ws://0.0.0.0:${PORT}`)
