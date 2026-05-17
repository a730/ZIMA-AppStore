# Security Guide for RomM

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
| 8083 | HTTP | romm service | Yes |

## Data Storage

| Data | Location | Encryption | Can user delete? |
|------|----------|------------|------------------|
| romm data | `/DATA/AppData/romm/library` | None at rest | Yes |
| romm data | `/DATA/AppData/romm/resources` | None at rest | Yes |
| db data | `/DATA/AppData/romm/db` | None at rest | Yes |
| cache data | `/DATA/AppData/romm/cache` | None at rest | Yes |


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
tar -czf backup-$(date +%Y%m%d).tar.gz /DATA/AppData/romm

# Restart
docker compose up -d
```

## Security Recommendations

1. Set strong values for: - `ROMM_DB_ROOT_PASSWORD`
   Generate secrets with: `openssl rand -hex 32`
2. Do not expose database ports to the host LAN
3. Use a reverse proxy with TLS for external access
4. Keep the app updated to the latest version
5. Review logs regularly for unauthorized access attempts

## Vulnerability Disclosure

Report vulnerabilities through the central disclosure policy at [SECURITY.md](../SECURITY.md).

## SBOM

Software Bill of Materials for this app's images is available at [../../sboms/romm/](../../sboms/romm/).

## Supply Chain

- Base image: `rommapp/romm:latest`
- SBOM: Auto-generated via Trivy (see ../../sboms/romm/)
- Image signing: Cosign signatures available in GHCR
