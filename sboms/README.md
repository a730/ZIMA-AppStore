# Software Bill of Materials (SBOM)

This directory contains SPDX JSON SBOMs for every container image distributed through this app store.

## Layout

```
sboms/{app}/{sanitized-image-name}.spdx.json
```

Example:
```
sboms/vllm/ghcr.io_a730_vllm-cpu_latest.spdx.json
sboms/blender/linuxserver_blender_latest.spdx.json
```

## Generation

SBOMs are auto-generated using [Trivy](https://github.com/aquasecurity/trivy) in CI (`trivy image --format spdx-json`).

They are regenerated on each release and committed here.

## Usage

Use these SBOMs for:

- **Vulnerability scanning**: `trivy sbom sbom-file.spdx.json`
- **License compliance**: check licenses of all dependencies
- **Supply chain risk**: verify base images and dependency provenance
- **NIS2 / CRA compliance**: maintain SBOMs for regulatory requirements

## Format

All SBOMs follow the [SPDX 2.3](https://spdx.dev/specifications/) specification in JSON format.
