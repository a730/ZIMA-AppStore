# Security Guide for SwarmClaw

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

## Data Storage

| Data | Location | Encryption | Can user delete? |
|------|----------|------------|------------------|
| swarmclaw data | `/DATA/AppData/swarmclaw/data` | None at rest | Yes |


## Network Access

- The app connects to the internet for update checks and package downloads.
- To block egress, add a firewall rule denying outbound traffic from the app container.
- Recommended: block all outbound except to trusted registries.

## Backups

To back up this app:
```bash
# Stop the app
docker compose down

# Back up data directories
tar -czf backup-$(date +%Y%m%d).tar.gz /DATA/AppData/swarmclaw

# Restart
docker compose up -d
```

## Security Recommendations

1. Set strong values for: - `SWARMCLAW_ACCESS_KEY`
   Generate secrets with: `openssl rand -hex 32`
2. Do not expose database ports to the host LAN
3. Use a reverse proxy with TLS for external access
4. Keep the app updated to the latest version
5. Review logs regularly for unauthorized access attempts

## Vulnerability Disclosure

Report vulnerabilities through the central disclosure policy at [SECURITY.md](../SECURITY.md).

## SBOM

Software Bill of Materials for this app's images is available at [../../sboms/swarmclaw/](../../sboms/swarmclaw/).

## Supply Chain

- Base image: `ghcr.io/swarmclawai/swarmclaw:latest`
- SBOM: Auto-generated via Trivy (see ../../sboms/swarmclaw/)
- Image signing: Cosign signatures available in GHCR
