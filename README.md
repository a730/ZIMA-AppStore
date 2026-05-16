# Third Party Generative AI AppStore for ZimaOS (& CasaOS)

Your go-to App Store for Generative AI apps for CasaOS and ZimaOS devices like the [ZimaCube Pro](https://www.zimaboard.com/zimacube-pro).

## Security & Compliance

Every app in this store passes automated security hardening checks in CI:

| Check | What it prevents |
|-------|------------------|
| Hardcoded secrets | Passwords, API keys, and tokens must use `${VAR}` env patterns, not literal values |
| Privileged containers | Flags apps running with unrestricted host access (`privileged: true`) |
| Exposed database ports | DB ports (5432, 6379, 3306) flagged if exposed to the host LAN unnecessarily |
| `:latest` image tags | Pinned version tags required for reproducible deployments |
| Missing resource limits | CPU/memory limits checked on every main service |
| Capability hardening | Verifies `cap_drop: ALL` when `cap_add` is used |
| `no-new-privileges` | Checks `security_opt: no-new-privileges:true` is set |

**Business-grade apps** (compliance.yaml + SECURITY.md) additionally document:
- Data storage locations, encryption, and retention policies
- Network egress (telemetry, update checks, external API calls)
- Authentication methods (local accounts, SSO, MFA)
- Backup strategies and audit logging capabilities
- Supply chain (SBOM, base image, CVE tracking)
- Known CVEs and security recommendations

Every app is scanned for critical/high CVEs using Trivy on each CI run.

## Available Apps

| App | Description | Category | GPU |
|---|---|---|---|
| [InvokeAI](https://github.com/search?q=invoke-ai&type=repositories) | Advanced Stable Diffusion Interface | Generative AI | NVidia |
| [LLM Scaler](https://github.com/search?q=intel&type=repositories) | Intel Arc optimized LLM scaling | Generative AI | NVidia |
| [Open WebUI](https://github.com/search?q=open-webui&type=repositories) | Interface for your local LLMs | Generative AI | NVidia |
| [SGLang (AVX2 CPU)](https://github.com/search?q=sgl-project&type=repositories) | High-performance LLM serving (AVX2 CPU) | Generative AI | NVidia |
| [SGLang (CUDA)](https://github.com/search?q=sglang-project&type=repositories) | High-performance LLM inference (CUDA 12 + HiCache) | Generative AI | NVidia |
| [Unsloth Studio](https://github.com/search?q=unsloth&type=repositories) | Efficient LLM fine-tuning and deployment | Generative AI | NVidia |
| [vLLM (AVX2 + OpenVINO)](https://github.com/search?q=vllm-project&type=repositories) | High-throughput LLM serving (AVX2 + OpenVINO) | Generative AI | NVidia |
| [Qdrant](https://github.com/qdrant/qdrant) | High-performance vector database for AI | AI Serving | NVidia |
| [Hermes Web UI](https://github.com/search?q=EKKOLearnAI&type=repositories) | Web dashboard for Hermes Agent | Agent Platforms | No |
| [HermesHQ](https://github.com/search?q=jpalmae&type=repositories) | Control plane for Hermes Agent instances | Agent Platforms | No |
| [MCPHub](https://github.com/search?q=samanhappy&type=repositories) | Unified hub for MCP server management | Agent Platforms | No |
| [Mission Control](https://github.com/search?q=Builderz%20Labs&type=repositories) | AI agent orchestration dashboard | Agent Platforms | No |
| [OpenClaw OS](https://github.com/search?q=thesysdev&type=repositories) | All-in-one AI assistant with generative workspace | Agent Platforms | No |
| [Paperclip](https://github.com/search?q=Paperclip%20AI&type=repositories) | AI agent company orchestration platform | Agent Platforms | No |
| [SwarmClaw](https://github.com/search?q=SwarmClaw%20AI&type=repositories) | Self-hosted AI agent runtime and multi-agent framework | Agent Platforms | No |
| [SwarmControl](https://github.com/search?q=SwarmClaw%20AI%20%2B%20Builderz%20Labs&type=repositories) | Autonomous AI agent swarm orchestration with local LLM | Agent Platforms | No |
| [Blinko](https://github.com/blinkospace/blinko) | Privacy-first AI note-taking and knowledge base | Productivity | No |
| [BookStack](https://github.com/BookStackApp/BookStack) | Self-hosted documentation wiki | Productivity | No |
| [Paperless-ngx](https://github.com/paperless-ngx/paperless-ngx) | Document management system with OCR | Productivity | No |
| [Coolify](https://github.com/search?q=coollabsio&type=repositories) | Coolify | SelfHost | No |
| [ZeroDotEmail](https://github.com/search?q=Mail-0&type=repositories) | AI-powered, privacy-first email client | Communication | No |
| [HandBrake](https://github.com/search?q=LinuxServer.io&type=repositories) | Open-source video transcoder with web GUI | Creative Tools | No |
| [MusicBrainz Picard](https://github.com/search?q=jlesage&type=repositories) | Cross-platform music tagger with web GUI | Creative Tools | No |
| [Blender](https://www.blender.org) | A free and open-source 3D computer graphics software toolset used for creating animated films, visual effects, art, 3D printed models, motion graphics, interactive 3D applications, virtual reality, and computer games. This image does not support GPU rendering out of the box only accelerated workspace experience | LinuxServer.io | No |
| [CNCjs](https://github.com/search?q=cncjs&type=repositories) | Web-based CNC milling controller interface | Makerspace | No |
| [Mango](https://github.com/search?q=a730&type=repositories) | Self-hosted manga server and web reader with anime streaming | Entertainment | No |
| [OneDev](https://github.com/search?q=onedev&type=repositories) | All-in-one DevOps platform | Development | No |
| [Open Terminal](https://github.com/search?q=open-webui&type=repositories) | Secure web-based terminal | Utilities | No |
| [RomM](https://github.com/search?q=romm&type=repositories) | Beautiful ROM manager | Games | No |

## Quick Start

1. Install [CasaOS](https://casaos.io) or [ZimaOS](https://www.zimaboard.com/zimacube-pro) on your device
2. Add this app store via the CasaOS/ZimaOS App Store settings
3. Browse and install any app with one click

## Hardware Requirements

- **Minimum**: Any x86_64 or arm64 device running CasaOS/ZimaOS
- **Recommended**: Device with dedicated GPU (NVIDIA RTX series or Intel Arc) for AI workloads
- **Storage**: SSD recommended for AI model storage
