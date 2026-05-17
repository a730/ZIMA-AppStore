# Security Guide for SwarmControl

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
| 3456 | HTTP | swarmclaw service | Yes |
| 3457 | HTTP | swarmclaw service | Yes |
| 18789 | HTTP | gateway-bridge service | Yes |
| 3000 | HTTP | swarmcontrol service | Yes |

## Data Storage

| Data | Location | Encryption | Can user delete? |
|------|----------|------------|------------------|
| swarmclaw data | `/DATA/AppData/swarm-control/swarmclaw-data` | None at rest | Yes |
| ollama data | `/DATA/AppData/swarm-control/ollama` | None at rest | Yes |
| swarmcontrol data | `/DATA/AppData/swarm-control/mc-data` | None at rest | Yes |


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
tar -czf backup-$(date +%Y%m%d).tar.gz /DATA/AppData/swarm-control

# Restart
docker compose up -d
```

## Security Recommendations

1. Set strong values for: - `OPENAI_API_KEY`, - `ANTHROPIC_API_KEY`, - `SWARMCLAW_API_KEY`, - `MC_AUTH_USER`, - `MC_AUTH_PASS`, - `MC_API_KEY`, - `MC_RETAIN_TOKEN_USAGE_DAYS`
   Generate secrets with: `openssl rand -hex 32`
2. Do not expose database ports to the host LAN
3. Use a reverse proxy with TLS for external access
4. Keep the app updated to the latest version
5. Review logs regularly for unauthorized access attempts

## Vulnerability Disclosure

Report vulnerabilities through the central disclosure policy at [SECURITY.md](../SECURITY.md).

## SBOM

Software Bill of Materials for this app's images is available at [../../sboms/swarm-control/](../../sboms/swarm-control/).

## Supply Chain

- Base image: `ghcr.io/builderz-labs/mission-control:latest`
- SBOM: Auto-generated via Trivy (see ../../sboms/swarm-control/)
- Image signing: Cosign signatures available in GHCR
