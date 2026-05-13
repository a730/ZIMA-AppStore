# SwarmControl

**Combined SwarmClaw + Mission Control** — a unified platform for running and orchestrating autonomous AI agent swarms.

SwarmClaw runs the agent runtime (multi-agent framework, CEO/boss orchestrator, delegation, memory, skills).  
Mission Control provides the dashboard for managing agents, dispatching tasks, tracking logs, and monitoring the swarm.  
The Gateway Bridge connects them automatically so every agent in the swarm appears natively in Mission Control.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SwarmControl                             │
│                                                                 │
│  ┌──────────────┐    ┌────────────────┐    ┌─────────────────┐  │
│  │  SwarmClaw   │    │ Gateway Bridge │    │ Mission Control │  │
│  │  (Agent      │◄──►│ (OpenClaw GW   │◄──►│ (Orchestration  │  │
│  │   Runtime)   │    │  Protocol)     │    │  Dashboard)     │  │
│  │  :3456       │    │  :18789        │    │  :3000          │  │
│  └──────────────┘    └────────────────┘    └─────────────────┘  │
│         │                    │                      │           │
│         │  REST API          │  WebSocket            │  Browser │
│         ▼                    ▼                      ▼           │
│  Agents / CEO          OpenClaw GW              UI / Tasks     │
│  Swarms / Skills       Agent Nodes              Logs / Eval    │
│  Memory / MCP          Status Events            Agent Control  │
└─────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Clone and setup
git clone <this-repo>
cd swarm-control
cp .env.example .env
bash scripts/setup.sh

# Open Mission Control
open http://localhost:3000/setup

# Open SwarmClaw
open http://localhost:3456
```

### Prerequisites

- Docker & Docker Compose

## Configuration

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SWARMCLAW_API_URL` | `http://swarmclaw:3456` | URL for the SwarmClaw API |
| `SWARMCLAW_API_KEY` | `auto` | API key for SwarmClaw auth (used by CEO agent + bridge) |
| `MC_PORT` | `3000` | Mission Control UI port |
| `MC_AUTH_USER` | `admin` | Mission Control admin username |
| `MC_AUTH_PASS` | (auto-generated) | Mission Control admin password |
| `MC_API_KEY` | (auto-generated) | Mission Control API key |
| `GATEWAY_BRIDGE_PORT` | `18789` | OpenClaw gateway WebSocket port |
| `AGENT_SYNC_INTERVAL_MS` | `5000` | How often agents are synced from SwarmClaw to Mission Control |

### CEO / Boss Agent

The CEO agent in SwarmClaw is an agent with `orchestratorEnabled: true`. It uses the SwarmClaw API to delegate tasks to sub-agents. The `SWARMCLAW_API_URL` and `SWARMCLAW_API_KEY` env vars configure the API connection that the bridge uses to talk to SwarmClaw. Agents and their org-chart hierarchy are automatically mirrored to Mission Control.

## How It Works

1. **SwarmClaw** runs the agent runtime. Create agents, configure the CEO orchestrator, set up delegations and skills as usual.
2. **Gateway Bridge** polls SwarmClaw's REST API (`/api/agents`) every `AGENT_SYNC_INTERVAL_MS` and exposes them as an [OpenClaw gateway](https://github.com/builderz-labs/mission-control) WebSocket.
3. **Mission Control** connects to the bridge via the standard OpenClaw gateway protocol (v3) at ws://gateway-bridge:18789, discovers all agent nodes, and displays them in the dashboard.
4. Agent status changes propagate in real-time via gateway `agent.status` events and periodic `tick` snapshots.
5. Org-chart hierarchy (parent/child relationships) becomes the agent network graph in Mission Control.

## Commands

```bash
npm run setup     # First-time setup (generates .env, starts services)
npm run start     # Start all services
npm run stop      # Stop all services
npm run logs      # Follow logs
npm run status    # Service status
npm run teardown  # Remove all containers and volumes
npm run update    # Pull latest images and restart
```

## Services

| Service | Port | Description |
|---|---|---|
| SwarmClaw | 3456 | Agent runtime & UI |
| Mission Control | 3000 | Orchestration dashboard |
| Gateway Bridge | 18789 | OpenClaw WebSocket gateway |
