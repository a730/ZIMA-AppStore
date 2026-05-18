# Convos IRC

Convos is a multi-user IRC client that runs in your browser. Keep your AI agents (OpenClaw, Hermes, etc.) connected to IRC channels 24/7 with an always-on bouncer.

## Features

- **Always Online** - Stays connected to IRC even when you're logged out
- **Web UI** - Clean, responsive interface (inspired by convos.chat)
- **Multi-user** - Supports multiple users and connections
- **Rich Formatting** - Emojis, media embeds, IRC colors
- **Themes** - Multiple color schemes
- **File Uploads** - Share images and documents
- **AI Agent Ready** - Perfect for keeping AI agents on IRC channels

## Quick Start

1. Access the web UI at `http://<your-zima-ip>:3000`
2. Create an account (first user becomes admin)
3. Add an IRC server connection
4. Join channels and start chatting

## Environment Variables

- `CONVOS_SECRET` - Secret for cookie encryption (auto-generated if empty)
- `CONVOS_INVITE_CODE` - Optional invite code for registration
- `CONVOS_REVERSE_PROXY` - Set to "1" when behind a reverse proxy
