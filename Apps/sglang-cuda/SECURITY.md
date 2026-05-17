# Security Guide for SGLang (CUDA)

## Default Credentials

| Type | Value | Change Required |
|------|-------|-----------------|
| API key | None (no auth by default) | Recommended |
| HF token | Set via `HF_TOKEN` env var | Optional |

No default credentials are set. The OpenAI-compatible API is open by default.
For production use, place behind a reverse proxy with TLS and authentication.

## Exposed Ports

| Port | Protocol | Purpose | Should be exposed? |
|------|----------|---------|--------------------|
| 8001 | HTTP | SGLang OpenAI-compatible API | Yes (LAN only) |

## Data Storage

| Data | Location | Encryption | Can user delete? |
|------|----------|------------|------------------|
| Model cache | `/DATA/AppData/sglang-cuda/models` | None at rest | Yes |
| Configuration | Env vars (not persisted to disk) | N/A | N/A |

## Network Access

- The app connects to huggingface.co to download models on first boot.
- Optional: set `HF_TOKEN` for gated models.
- To block egress, add a firewall rule denying outbound traffic from the container.

## Backups

To back up this app:
```bash
docker compose down
tar -czf sglang-cuda-backup-$(date +%Y%m%d).tar.gz /DATA/AppData/sglang-cuda/
docker compose up -d
```

## Security Recommendations

1. Set `HF_TOKEN` via environment variables for gated models
2. Use a reverse proxy with TLS for external access
3. Keep the app updated — rebuild from the latest SGLang base image
4. Review logs regularly for unusual access patterns

## Vulnerability Disclosure

Report vulnerabilities through the central disclosure policy at [SECURITY.md](../SECURITY.md).

## SBOM

Software Bill of Materials for this app's images is available at [../../sboms/sglang-cuda/](../../sboms/sglang-cuda/).


## Supply Chain

- Base image: `lmsysorg/sglang:v0.5.11-cu129-runtime`
- SBOM: Auto-generated via Trivy (see ../../sboms/sglang-cuda/)
- Image signing: Cosign signatures available in GHCR
