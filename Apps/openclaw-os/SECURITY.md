# Security Guide for OpenClaw OS

## Default Credentials

| Type | Value | Change Required |
|------|-------|-----------------|
| Gateway token | Auto-generated on first launch | Yes |
| API keys | Set via `openclaw.json` config | Recommended |

Change all default credentials before exposing to a network.

## Exposed Ports

| Port | Protocol | Purpose | Should be exposed? |
|------|----------|---------|--------------------|
| 18789 | HTTP | OpenClaw gateway + workspace UI | Yes |

## Data Storage

| Data | Location | Encryption | Can user delete? |
|------|----------|------------|------------------|
| Configuration | `/home/node/.openclaw/config` | None at rest | Yes |
| Workspace data | `/home/node/.openclaw/workspace` | None at rest | Yes |
| Credentials | `/home/node/.openclaw/auth` | At rest | Yes |
| Plugin data | `/home/node/.openclaw/plugins` | None at rest | Yes |

## Network Access

- The gateway connects to LLM providers (OpenAI, Anthropic, Google, etc.) for AI responses.
- Channel integrations connect to messaging platforms (Telegram, Discord, Slack, WhatsApp, etc.).
- To block egress, add a firewall rule denying outbound traffic from the app container.
- Recommended: restrict outbound to only the LLM providers and channels you use.

## Backups

To back up this app:
```bash
# Stop the app
docker compose down

# Back up data directories
tar -czf backup-$(date +%Y%m%d).tar.gz /DATA/AppData/openclaw-os/

# Restart
docker compose up -d
```

## Security Recommendations

1. Set an explicit `OPENCLAW_GATEWAY_TOKEN` via environment variables — generate with: `openssl rand -hex 32`
2. Use a reverse proxy with TLS for external access
3. Configure `dmPolicy="pairing"` for all messaging channels to prevent unauthorized access
4. Keep the app updated to the latest version
5. Review logs regularly for unauthorized access attempts
6. Run `openclaw doctor` periodically to surface risky/misconfigured DM policies
7. Store API keys in `openclaw.json` with restricted file permissions (600)

## Known CVEs

Track known vulnerabilities at:
- [OpenClaw Security Advisories](https://github.com/openclaw/openclaw/security)
- [OpenClaw-OS Security Advisories](https://github.com/thesysdev/openclaw-os/security)

## Supply Chain

- Base image: `node:24-bookworm-slim`
- SBOM: Generated on each CI build via Trivy
- Image signing: Cosign signatures available in GHCR
