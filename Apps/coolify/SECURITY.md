# Security Guide for Coolify

## Default Credentials

| Type | Value | Change Required |
|------|-------|-----------------|
| Admin username | `admin` | Yes |
| Admin password | Auto-generated on first launch | Yes |
| Database password | Set via environment variable | Recommended |
| API key | Auto-generated | Recommended |

Change all default credentials before exposing to a network.

## Exposed Ports

| Port | Protocol | Purpose | Should be exposed? |
|------|----------|---------|--------------------|
| 8000 | HTTP | zimaos-coolify service | Yes |
| 6001 | HTTP | zimaos-coolify-soketi service | Yes |
| 6002 | HTTP | zimaos-coolify-soketi service | Yes |

## Data Storage

| Data | Location | Encryption | Can user delete? |
|------|----------|------------|------------------|
| zimaos-coolify data | `/DATA/AppData/$AppID/ssh` | None at rest | Yes |
| zimaos-coolify data | `/DATA/AppData/$AppID/applications` | None at rest | Yes |
| zimaos-coolify data | `/DATA/AppData/$AppID/databases` | None at rest | Yes |
| zimaos-coolify data | `/DATA/AppData/$AppID/services` | None at rest | Yes |
| zimaos-coolify data | `/DATA/AppData/$AppID/backups` | None at rest | Yes |
| zimaos-coolify data | `/DATA/AppData/$AppID/webhooks-during-maintenance` | None at rest | Yes |
| zimaos-coolify data | `/DATA/AppData/$AppID/logs` | None at rest | Yes |
| zimaos-coolify-postgres data | `/DATA/AppData/$AppID/pgdata` | None at rest | Yes |
| zimaos-coolify-redis data | `/DATA/AppData/$AppID/redis` | None at rest | Yes |


## Network Access

- The app connects to external LLM APIs (OpenAI, Anthropic, etc.) for AI features.
- The app connects to the internet for update checks and package downloads.
- To block egress, add a firewall rule denying outbound traffic from the app container.
- Recommended: block all outbound except to trusted registries.

## Backups

To back up this app:
```bash
# Stop the app
docker compose down

# Back up data directories
tar -czf backup-$(date +%Y%m%d).tar.gz /DATA/AppData/$AppID

# Restart
docker compose up -d
```

## Security Recommendations

1. Set strong values for: - `APP_KEY`, - `DB_PASSWORD`, - `REDIS_PASSWORD`, - `REDIS_PASSWORD`, - `PUSHER_APP_KEY`, - `PUSHER_APP_SECRET`, - `STRIPE_API_KEY`, - `STRIPE_WEBHOOK_SECRET`, - `POSTGRES_PASSWORD`, - `COOLIFY_DB_PASSWORD`, - `REDIS_PASSWORD`, - `COOLIFY_REDIS_PASSWORD`, - `SOKETI_DEFAULT_APP_KEY`, - `SOKETI_DEFAULT_APP_SECRET`
   Generate secrets with: `openssl rand -hex 32`
2. Do not expose database ports to the host LAN
3. Use a reverse proxy with TLS for external access
4. Keep the app updated to the latest version
5. Review logs regularly for unauthorized access attempts

## Known CVEs

Track known vulnerabilities at:
- [GitHub Security Advisories](https://github.com/{owner}/{repo}/security)
- [Docker Hub CVEs](https://hub.docker.com/r/{image})

## Supply Chain

- Base image: `ghcr.io/coollabsio/coolify:latest`
- SBOM: Generated on each CI build via Syft
- Image signing: Cosign signatures available in GHCR
