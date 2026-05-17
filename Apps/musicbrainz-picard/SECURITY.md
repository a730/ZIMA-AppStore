# Security Guide for MusicBrainz Picard

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
| 5800 | HTTP | picard service | Yes |

## Data Storage

| Data | Location | Encryption | Can user delete? |
|------|----------|------------|------------------|
| picard data | `/DATA/AppData/musicbrainz-picard/config` | None at rest | Yes |
| picard data | `/DATA/AppData/musicbrainz-picard/storage` | None at rest | Yes |


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
tar -czf backup-$(date +%Y%m%d).tar.gz /DATA/AppData/musicbrainz-picard

# Restart
docker compose up -d
```

## Security Recommendations

1. Set a strong `SECRET_KEY` via environment variables — generate with: `openssl rand -hex 32`
2. Do not expose database ports to the host LAN
3. Use a reverse proxy with TLS for external access
4. Keep the app updated to the latest version
5. Review logs regularly for unauthorized access attempts

## Known CVEs

Track known vulnerabilities at:
- [GitHub Security Advisories](https://github.com/{owner}/{repo}/security)
- [Docker Hub CVEs](https://hub.docker.com/r/{image})

## Supply Chain

- Base image: `jlesage/musicbrainz-picard:latest`
- SBOM: Generated on each CI build via Syft
- Image signing: Cosign signatures available in GHCR
