# Security Guide for Paperless-ngx

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
| 8002 | HTTP | webserver service | Yes |

## Data Storage

| Data | Location | Encryption | Can user delete? |
|------|----------|------------|------------------|
| webserver data | `/DATA/AppData/paperless-ngx/data` | None at rest | Yes |
| webserver data | `/DATA/AppData/paperless-ngx/media` | None at rest | Yes |
| webserver data | `/DATA/AppData/paperless-ngx/export` | None at rest | Yes |
| webserver data | `/DATA/AppData/paperless-ngx/consume` | None at rest | Yes |
| broker data | `/DATA/AppData/paperless-ngx/redis` | None at rest | Yes |
| db data | `/DATA/AppData/paperless-ngx/postgres` | None at rest | Yes |


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
tar -czf backup-$(date +%Y%m%d).tar.gz /DATA/AppData/paperless-ngx

# Restart
docker compose up -d
```

## Security Recommendations

1. Set strong values for: - `PAPERLESS_SECRET_KEY`
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

- Base image: `ghcr.io/paperless-ngx/paperless-ngx:latest`
- SBOM: Generated on each CI build via Syft
- Image signing: Cosign signatures available in GHCR
