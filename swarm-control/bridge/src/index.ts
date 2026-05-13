import type { EnvConfig } from './types.ts'
import { SwarmClawClient } from './swarmclaw-client.ts'
import { GatewayServer } from './gateway-server.ts'

function loadConfig(): EnvConfig {
  return {
    swarmclawApiUrl: process.env.SWARMCLAW_API_URL || 'http://localhost:3456',
    swarmclawApiKey: process.env.SWARMCLAW_API_KEY || 'auto',
    gatewayBridgePort: Number(process.env.GATEWAY_BRIDGE_PORT || '18789'),
    agentSyncIntervalMs: Number(process.env.AGENT_SYNC_INTERVAL_MS || '5000'),
  }
}

const config = loadConfig()
const swarmclaw = new SwarmClawClient(config)
const gateway = new GatewayServer(config, swarmclaw)

gateway.start()

process.on('SIGTERM', () => {
  console.log('Shutting down...')
  gateway.stop()
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('Shutting down...')
  gateway.stop()
  process.exit(0)
})
