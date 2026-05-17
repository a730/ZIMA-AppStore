# Security Guide for vLLM (AVX2 + OpenVINO)

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
| 8003 | HTTP | vllm service | Yes |

## Data Storage

| Data | Location | Encryption | Can user delete? |
|------|----------|------------|------------------|
| vllm data | `/DATA/AppData/vllm/models` | None at rest | Yes |
| vllm data | `/DATA/AppData/vllm/config` | None at rest | Yes |


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
tar -czf backup-$(date +%Y%m%d).tar.gz /DATA/AppData/vllm

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

- Base image: `ghcr.io/a730/vllm-cpu:latest`
- SBOM: Generated on each CI build via Syft
- Image signing: Cosign signatures available in GHCR
