# Security Policy for SGLang (AVX2 CPU)

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| v0.5.11 | ✅                 |

## Security Considerations

### Exposed Ports
- **8004**: HTTP API endpoint (OpenAI-compatible). No authentication is built-in.
  - Recommended: Bind to localhost or use a reverse proxy with auth.

### Model Cache
- Downloaded models are stored in `/DATA/AppData/sglang-avx2/models`
- Models may contain sensitive data depending on the model used
- Cache persists across container restarts

### HuggingFace Token
- If you configure `HF_TOKEN`, it is stored as an environment variable
- The token is used to download gated models
- Treat this token as sensitive information

### Container Privileges
- Runs as root inside the container (required for numactl and memory management)
- No network privileges beyond port exposure

### Data Storage
- All data is stored locally on the host filesystem
- No telemetry or external data transmission

## Reporting a Vulnerability

Report issues to the ZIMA AppStore repository.
