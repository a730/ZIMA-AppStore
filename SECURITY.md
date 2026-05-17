# Vulnerability Disclosure Policy

## Scope

This policy covers all container images and Docker Compose configurations distributed through this app store. Each app directory under `Apps/` contains a `SECURITY.md` with app-specific security details.

## Reporting a Vulnerability

**Please report vulnerabilities via GitHub Private Vulnerability Reporting:**

[https://github.com/a730/ZIMA-AppStore/security/advisories/new](https://github.com/a730/ZIMA-AppStore/security/advisories/new)

This is the preferred and fastest channel. GitHub handles encryption, identity verification, and coordinated disclosure automatically.

### What to include

- Which app / image is affected
- Steps to reproduce
- Severity estimation (CVSS if possible)
- Any known mitigations or workarounds

## Scope

### In scope
- Container images distributed through this store
- Docker Compose configuration files
- Supply chain vulnerabilities (base images, dependencies)
- Hardcoded secrets or credentials

### Out of scope
- Physical attacks or social engineering
- Denial-of-service attacks
- Vulnerabilities in apps themselves (report to the upstream project)
- Issues requiring physical access to a device

## Safe Harbor

We will not pursue legal action against security researchers who:

- Report vulnerabilities through the designated channels
- Act in good faith and with reasonable care
- Do not access or destroy more data than necessary
- Do not exploit a vulnerability beyond what is needed to demonstrate it
- Allow reasonable time for remediation before public disclosure

This safe harbor applies to all researchers operating within the EU/EEA, Norway, Switzerland, and the United Kingdom, in accordance with relevant safe harbor frameworks including GDPR Article 33 (breach notification) and NIS2 Article 31 (coordinated disclosure).

## Regulatory Context

This policy is designed to align with European and Nordic regulatory frameworks:

| Regulation | Relevance |
|------------|-----------|
| **GDPR** (EU/EEA Art. 33) | Breach notification obligations |
| **NIS2 Directive** (EU 2022/2555) | Supply chain security, coordinated disclosure |
| **Cyber Resilience Act** (EU 2023/…) | SBOM requirements for software with digital elements |
| **EU AI Act** (EU 2024/…) | Risk classification for AI-serving apps in this store |
| **Norwegian Digital Security Act** (digitalsikkerhetsloven) | Incident reporting, ISMS requirements |
| **Swiss nFADP** (nDSG/nFADP) | Data protection and breach notification |

For AI-serving apps (open-webui, vllm, sglang-cuda, invoke, unsloth-studio, llm-scaler, hermeshq, openclaw-os, hermes-web-ui), refer to the app's `compliance.yaml` for model provenance, training data documentation, and risk classification under the EU AI Act.

## SBOM (Software Bill of Materials)

SBOMs in SPDX JSON format are generated for every container image on each CI build and published in the `sboms/` directory of this repository:

```
sboms/{app}/{sanitized-image-name}.spdx.json
```

SBOMs are regenerated on each release. You can use these SBOMs for:
- Vulnerability scanning with tools like Trivy or Grype
- License compliance verification
- Supply chain risk assessment
- NIS2 / CRA compliance documentation

## Contact

**Primary**: GitHub Private Vulnerability Reporting
[https://github.com/a730/ZIMA-AppStore/security/advisories/new](https://github.com/a730/ZIMA-AppStore/security/advisories/new)

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-05-17 | Initial policy |
