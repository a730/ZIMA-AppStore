# Security Guide for Paperclip

## Default Credentials

| Type | Value | Change Required |
|------|-------|-----------------|
| Admin username | `admin` | Yes |
| Admin password | Auto-generated on first launch | Yes |
| API key | Auto-generated | Recommended |

Change all default credentials before exposing to a network.

## Exposed Ports

| Port | Protocol | Purpose | Should be exposed? |
|------|----------|---------|--------------------|
| 3101 | HTTP | paperclip service | Yes |

## Data Storage

| Data | Location | Encryption | Can user delete? |
|------|----------|------------|------------------|
| paperclip data | `/DATA/AppData/paperclip/data` | None at rest | Yes |


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
tar -czf backup-$(date +%Y%m%d).tar.gz /DATA/AppData/paperclip

# Restart
docker compose up -d
```

## Security Recommendations

1. Set strong values for: - `BETTER_AUTH_SECRET`, - `OPENAI_API_KEY`, - `ANTHROPIC_API_KEY`
   Generate secrets with: `openssl rand -hex 32`
2. Do not expose database ports to the host LAN
3. Use a reverse proxy with TLS for external access
4. Keep the app updated to the latest version
5. Review logs regularly for unauthorized access attempts

## Vulnerability Disclosure

Report vulnerabilities through the central disclosure policy at [SECURITY.md](../SECURITY.md).

## SBOM

Software Bill of Materials for this app's images is available at [../../sboms/paperclip/](../../sboms/paperclip/).

## Supply Chain

- Base image: `ghcr.io/paperclipai/paperclip:latest`
- SBOM: Auto-generated via Trivy (see ../../sboms/paperclip/)
- Image signing: Cosign signatures available in GHCR
