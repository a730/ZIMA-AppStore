# Third Party AppStore for ZimaOS (& CasaOS)

Your go-to App Store for CasaOS and ZimaOS devices like the [ZimaCube Pro](https://www.zimaboard.com/zimacube-pro), featuring 28 apps spanning Generative AI, agent platforms, productivity, development, and more.

## Disclaimer

Apps listed here are third-party software. This store provides Docker Compose configurations — container images are hosted and maintained by their respective upstream projects. This software is distributed under the Apache 2.0 license and is provided "AS IS" without warranty of any kind. Review each app's `SECURITY.md` and `compliance.yaml` before use.

## Security & Compliance

This store is designed to meet European regulatory standards (GDPR, NIS2, CRA, EU AI Act) with a comprehensive security posture:

### Vulnerability Disclosure Policy

Security researchers can report vulnerabilities via **GitHub Private Vulnerability Reporting**:
[https://github.com/a730/ZIMA-AppStore/security/advisories/new](https://github.com/a730/ZIMA-AppStore/security/advisories/new)

Includes **safe harbor** for researchers in EU/EEA/Norway/Switzerland. See [SECURITY.md](SECURITY.md) for the full policy.

### Automated CI Checks

Every app passes the following automated checks on each push:

| Check | What it prevents |
|-------|------------------|
| Hardcoded secrets | Passwords, API keys, and tokens must use `${VAR}` env patterns, not literal values |
| Privileged containers | Flags apps running with unrestricted host access (`privileged: true`) |
| Exposed database ports | DB ports (5432, 6379, 3306) flagged if exposed to the host LAN unnecessarily |
| Missing resource limits | CPU/memory limits checked on every main service |
| Capability hardening | Verifies `cap_drop: ALL` when `cap_add` is used |
| `no-new-privileges` | Checks `security_opt: no-new-privileges:true` is set |

### CVE Scanning & SBOM

Every container image across all 28 apps is **scanned for critical/high CVEs** using Trivy on each CI run. Additionally, **SPDX 2.3 SBOMs** are generated for every image and published in [sboms/](sboms/), providing full supply chain transparency for NIS2 and CRA compliance.

### Per-App Documentation

Each app includes:
- **`compliance.yaml`** — Data storage, network egress, authentication, hardening, compliance metadata
- **`SECURITY.md`** — Default credentials, exposed ports, backup procedures, security recommendations, SBOM location

## Available Apps

| App | Description | Category | GPU |
|---|---|---|---|
| [InvokeAI](https://github.com/search?q=invoke-ai&type=repositories) | Advanced Stable Diffusion Interface | Generative AI | NVidia |
| [LLM Scaler](https://github.com/search?q=intel&type=repositories) | Intel Arc optimized LLM scaling | Generative AI | NVidia |
| [Open WebUI](https://github.com/search?q=open-webui&type=repositories) | Interface for your local LLMs | Generative AI | NVidia |
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
| [Coolify](https://github.com/search?q=coollabsio&type=repositories) | Self-hosted PaaS for apps and services | SelfHost | No |
| [ZeroDotEmail](https://github.com/search?q=Mail-0&type=repositories) | AI-powered, privacy-first email client | Communication | No |
| [HandBrake](https://github.com/search?q=LinuxServer.io&type=repositories) | Open-source video transcoder with web GUI | Creative Tools | No |
| [MusicBrainz Picard](https://github.com/search?q=jlesage&type=repositories) | Cross-platform music tagger with web GUI | Creative Tools | No |
| [Blender](https://www.blender.org) | 3D computer graphics toolset for animation, VFX, art, and games | LinuxServer.io | No |
| [CNCjs](https://github.com/search?q=cncjs&type=repositories) | Web-based CNC milling controller interface | Makerspace | No |
| [Mango](https://github.com/search?q=a730&type=repositories) | Self-hosted manga server and web reader with anime streaming | Entertainment | No |
| [OneDev](https://github.com/search?q=onedev&type=repositories) | All-in-one DevOps platform | Development | No |
| [Open Terminal](https://github.com/search?q=open-webui&type=repositories) | Secure web-based terminal | Utilities | No |
| [RomM](https://github.com/search?q=romm&type=repositories) | Beautiful ROM manager | Games | No |

## Quick Start

1. Install [CasaOS](https://casaos.io) or [ZimaOS](https://www.zimaboard.com/zimacube-pro) on your device
2. Register this app store via CLI:
   ```bash
   casaos-cli app-management register app-store https://github.com/a730/ZIMA-AppStore/archive/refs/tags/v1.2.0.zip
   ```
3. Browse and install any app with one click

## Hardware Requirements

- **Minimum**: Any x86_64 or arm64 device running CasaOS/ZimaOS
- **Recommended**: Device with dedicated GPU (NVIDIA RTX series or Intel Arc) for AI workloads
- **Storage**: SSD recommended for AI model storage
