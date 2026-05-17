# Qdrant Security Guide

## Default Credentials

Qdrant has no default admin account. Access is open unless `QDRANT_API_KEY` is set.

| Credential | Value | Change Required |
|------------|-------|-----------------|
| API key   | Set via `QDRANT_API_KEY` env | Recommended |

## Exposed Ports

| Port | Protocol | Purpose | Should be exposed? |
|------|----------|---------|--------------------|
| 6333 | HTTP/REST | REST API + Web UI dashboard | Yes |
| 6334 | gRPC     | gRPC API for clients       | Only if needed |

## Data Storage

| Data | Location | Encryption | User deletable? |
|------|----------|------------|-----------------|
| Vector embeddings | `/qdrant/storage` | None at rest (TLS in transit) | Yes |
| Snapshots | `/qdrant/snapshots` | None | Yes |

## Network Access

Qdrant does not make any external network calls. Telemetry is disabled by default (`QDRANT__TELEMETRY_DISABLED: 'true'`). No outbound firewall rules are needed.

## Backups

Back up via built-in snapshot API:
```bash
curl -X POST 'http://localhost:6333/collections/{name}/snapshots'
```
Or by backing up the storage directory:
```bash
tar -czf qdrant-backup-$(date +%Y%m%d).tar.gz /DATA/AppData/qdrant/storage
```

## Security Recommendations

1. Set `QDRANT_API_KEY` to secure access — generate with: `openssl rand -hex 32`
2. Do not expose port 6334 (gRPC) to the host LAN unless needed
3. Use a reverse proxy with TLS for external access
4. Keep the image updated to the latest version

## Vulnerability Disclosure

Report vulnerabilities through the central disclosure policy at [SECURITY.md](../SECURITY.md).

## SBOM

Software Bill of Materials for this app's images is available at [../../sboms/qdrant/](../../sboms/qdrant/).


## Supply Chain

- Base image: `debian:bookworm-slim`
- SBOM: Generated via Syft on CI build
