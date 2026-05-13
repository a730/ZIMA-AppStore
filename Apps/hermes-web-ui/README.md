# Hermes Web UI

A full-featured web dashboard for [Hermes Agent](https://github.com/NousResearch/hermes-agent).

Manage AI chat sessions, monitor usage & costs, configure multi-platform channels, schedule cron jobs, browse skills — all from a clean, responsive web interface.

## Features

- **AI Chat** — Real-time streaming via SSE, multi-session management, session search (Ctrl+K), Markdown rendering, file upload/download, global model selector
- **Multi-Platform Channels** — Telegram, Discord, Slack, WhatsApp, Matrix, Feishu, WeChat, WeCom
- **Usage Analytics** — Token usage breakdown, session counts, cost tracking, model distribution charts
- **Scheduled Jobs** — Create, edit, pause, resume cron jobs with cron expression builder
- **Skills Browser** — Discover and install Hermes skills
- **Model Management** — View available models, set global model selection
- **Terminal** — Built-in web terminal for Hermes Agent gateway
- **Dark/Light themes** — Customizable accent colors

## Initial Setup

After installation:

1. Open **http://localhost:6060**
2. Create your admin account (if auth is enabled)
3. Configure Hermes Agent credentials in Settings
4. Start chatting with your AI agents

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AUTH_DISABLED` | `false` | Set to `true` to disable authentication for local-only access |

## Notes

- **First deployment** builds from source — this may take 10-15 minutes
- Data is stored in `/DATA/AppData/hermes-web-ui/`
- The Hermes Agent runtime is bundled in the Docker image
