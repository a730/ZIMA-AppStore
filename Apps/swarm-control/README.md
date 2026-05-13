# SwarmControl

**Autonomous AI agent swarm orchestration platform.**

SwarmControl combines [SwarmClaw](https://github.com/swarmclawai/swarmclaw) (AI agent runtime) with [Mission Control](https://github.com/builderz-labs/mission-control) (orchestration dashboard) into a single unified platform.

## Features

- **Multi-agent swarms** — CEO orchestrator agents that delegate to sub-agents with hierarchy and team roles
- **23+ LLM providers** — OpenClaw, Claude, GPT, Gemini, OpenRouter, Ollama, DeepSeek, Groq, and more
- **Agent memory** — Durable conversation history, shared knowledge base, and working state
- **MCP tools** — Model Context Protocol for extending agent capabilities
- **Skills marketplace** — Browse and install skills from ClawdHub and skills.sh
- **Real-time dashboard** — Agent status, sessions, logs, tasks, and metrics in Mission Control
- **Task orchestration** — Kanban board, task dispatch, quality gates, recurring schedules
- **Security** — RBAC, audit logging, secret detection, agent trust scoring

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   SwarmControl                       │
│                                                      │
│  ┌──────────┐    ┌──────────────┐    ┌────────────┐ │
│  │SwarmClaw │    │GW Bridge     │    │Mission Ctrl│ │
│  │Agents    │◄──►│(OpenClaw GW) │◄──►│Dashboard   │ │
│  │:3456     │    │:18789        │    │:3000       │ │
│  └──────────┘    └──────────────┘    └────────────┘ │
└─────────────────────────────────────────────────────┘
```

- **SwarmClaw** runs agents with autonomous CEO/orchestrator, delegation, memory, skills
- **Gateway Bridge** syncs all agents to an OpenClaw-compatible WebSocket gateway
- **Mission Control** connects to the bridge and displays every agent in real-time

## Initial Setup

After installation:

1. Open **Mission Control** at `http://localhost:3000/setup`
2. Create your admin account
3. The gateway bridge auto-connects — agents from SwarmClaw appear in the dashboard
4. Open **SwarmClaw** at `http://localhost:3456` to create agents and configure the CEO orchestrator

### Default Credentials

| Service        | URL                     | Login                                    |
|----------------|-------------------------|------------------------------------------|
| Mission Control | http://localhost:3000  | Set during initial setup wizard          |
| SwarmClaw      | http://localhost:3456  | First-run setup wizard                   |

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `SWARMCLAW_API_KEY` | `auto` | API key for SwarmClaw authentication |
| `MC_AUTH_PASS` | `swarmcontrol` | Mission Control admin password |
| `MC_API_KEY` | `swarmcontrol-api-key` | Mission Control API key |
| `NEXT_PUBLIC_GATEWAY_URL` | `ws://localhost:18789` | Browser WebSocket URL for the gateway bridge |

## Notes

- **First deployment** builds the gateway bridge from source — this may take several minutes
- All three services must be healthy for full functionality
- SwarmClaw and Mission Control each have independent first-run setup wizards
- Agents with `orchestratorEnabled: true` appear as "coordinator" nodes in Mission Control
