const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const APPS_DIR = path.join(__dirname, '..', 'Apps');
const README_PATH = path.join(__dirname, '..', 'README.md');

function getAppDirs() {
  return fs.readdirSync(APPS_DIR)
    .filter(f => fs.statSync(path.join(APPS_DIR, f)).isDirectory())
    .filter(f => f !== '__tests__');
}

function readCompose(appDir) {
  const composePath = path.join(APPS_DIR, appDir, 'docker-compose.yml');
  if (!fs.existsSync(composePath)) return null;
  return yaml.parse(fs.readFileSync(composePath, 'utf8'));
}

const CATEGORY_ORDER = [
  'Generative AI',
  'AI Serving',
  'Agent Platforms',
  'Productivity',
  'Dev Tools',
  'SelfHost',
  'Communication',
  'Gaming',
  'Creative Tools',
  'Maker Tools',
];

function getCategoryRank(cat) {
  const idx = CATEGORY_ORDER.indexOf(cat);
  return idx === -1 ? 999 : idx;
}

async function main() {
  const apps = [];
  const appDirs = getAppDirs();

  for (const dir of appDirs) {
    const compose = readCompose(dir);
    if (!compose || !compose['x-casaos']) continue;

    const meta = compose['x-casaos'];
    const mainService = compose.services[meta.main];
    const image = mainService?.image || '';

    const isGpu = meta.category === 'Generative AI' || meta.category === 'AI Serving';

    apps.push({
      dir,
      name: meta.title?.en_us || dir,
      description: meta.tagline?.en_us || '',
      category: meta.category || 'Other',
      image,
      url: getAppUrl(dir, meta),
      gpu: isGpu ? 'NVidia' : 'No',
    });
  }

  apps.sort((a, b) => {
    const catDiff = getCategoryRank(a.category) - getCategoryRank(b.category);
    if (catDiff !== 0) return catDiff;
    return a.name.localeCompare(b.name);
  });

  const header = `# Third Party Generative AI AppStore for ZimaOS (& CasaOS)

Your go-to App Store for Generative AI apps for CasaOS and ZimaOS devices like the [ZimaCube Pro](https://www.zimaboard.com/zimacube-pro).

## Security & Compliance

Every app in this store passes automated security hardening checks in CI:

| Check | What it prevents |
|-------|------------------|
| Hardcoded secrets | Passwords, API keys, and tokens must use \`\${VAR}\` env patterns, not literal values |
| Privileged containers | Flags apps running with unrestricted host access (\`privileged: true\`) |
| Exposed database ports | DB ports (5432, 6379, 3306) flagged if exposed to the host LAN unnecessarily |
| \`:latest\` image tags | Pinned version tags required for reproducible deployments |
| Missing resource limits | CPU/memory limits checked on every main service |
| Capability hardening | Verifies \`cap_drop: ALL\` when \`cap_add\` is used |
| \`no-new-privileges\` | Checks \`security_opt: no-new-privileges:true\` is set |

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
`;

  const rows = apps.map(a =>
    `| [${a.name}](${a.url}) | ${a.description} | ${a.category} | ${a.gpu} |`
  ).join('\n');

  const footer = `

## Quick Start

1. Install [CasaOS](https://casaos.io) or [ZimaOS](https://www.zimaboard.com/zimacube-pro) on your device
2. Add this app store via the CasaOS/ZimaOS App Store settings
3. Browse and install any app with one click

## Hardware Requirements

- **Minimum**: Any x86_64 or arm64 device running CasaOS/ZimaOS
- **Recommended**: Device with dedicated GPU (NVIDIA RTX series or Intel Arc) for AI workloads
- **Storage**: SSD recommended for AI model storage
`;

  const readme = header + rows + footer;
  fs.writeFileSync(README_PATH, readme);
  console.log(`Generated README.md with ${apps.length} apps`);
}

function getAppUrl(dir, meta) {
  if (meta.developer?.toLowerCase().includes('blinko')) return 'https://github.com/blinkospace/blinko';
  if (meta.developer?.toLowerCase().includes('bookstack')) return 'https://github.com/BookStackApp/BookStack';
  if (meta.developer?.toLowerCase().includes('paperless')) return 'https://github.com/paperless-ngx/paperless-ngx';
  if (meta.developer?.toLowerCase().includes('qdrant')) return 'https://github.com/qdrant/qdrant';
  if (dir === 'comfyui') return 'https://github.com/comfyanonymous/ComfyUI';
  if (dir === 'blender') return 'https://www.blender.org';
  return `https://github.com/search?q=${encodeURIComponent(meta.developer || dir)}&type=repositories`;
}

main().catch(console.error);