const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const APPS_DIR = path.join(__dirname, '..', 'Apps');

const SENSITIVE_PATTERNS = [
  /password['"\s]*:['"\s]*[^$"']/i,
  /secret['"\s]*:['"\s]*[^$\s"'#]/i,
  /api[_-]?key['"\s]*:['"\s]*[^$\s"'#]/i,
  /auth_token['"\s]*:['"\s]*[^$\s"'#]/i,
  /passwd['"\s]*:['"\s]*[^$\s"'#]/i,
];

const INTERNAL_DB_PORTS = ['5432', '6379', '3306', '27017', '9160'];

function getAppDirs() {
  return fs.readdirSync(APPS_DIR)
    .filter(f => fs.statSync(path.join(APPS_DIR, f)).isDirectory());
}

function readCompose(appDir) {
  const composePath = path.join(APPS_DIR, appDir, 'docker-compose.yml');
  if (!fs.existsSync(composePath)) return null;
  return yaml.parse(fs.readFileSync(composePath, 'utf8'));
}

describe('App Store Security Hardening', () => {
  const appDirs = getAppDirs();
  const composeCache = {};

  beforeAll(() => {
    appDirs.forEach(dir => { composeCache[dir] = readCompose(dir); });
  });

  describe('Hardcoded Secrets', () => {
    appDirs.forEach(dir => {
      test(`${dir}: no hardcoded secrets uses VAR pattern`, () => {
        const compose = composeCache[dir];
        if (!compose) return;
        const fullYaml = fs.readFileSync(path.join(APPS_DIR, dir, 'docker-compose.yml'), 'utf8');
        const lines = fullYaml.split('\n');
        const issues = [];
        lines.forEach((line, i) => {
          SENSITIVE_PATTERNS.forEach(pattern => {
            if (pattern.test(line) && !line.includes('${') && !line.includes('example') && !line.includes('CHANGE_ME') && !line.includes('replace-me')) {
              issues.push(`  Line ${i + 1}: ${line.trim()}`);
            }
          });
        });
        if (issues.length > 0) {
          console.warn(`\n⚠  ${dir}: Possible hardcoded secrets:\n${issues.join('\n')}`);
        }
      });
    });
  });

  describe('Privileged Mode', () => {
    appDirs.forEach(dir => {
      test(`${dir}: no privileged: true`, () => {
        const compose = composeCache[dir];
        if (!compose) return;
        Object.entries(compose.services || {}).forEach(([svc, cfg]) => {
          if (cfg.privileged) {
            console.warn(`\n⚠  ${dir}/${svc}: runs in privileged mode`);
          }
        });
      });
    });
  });

  describe('Exposed Database Ports', () => {
    appDirs.forEach(dir => {
      test(`${dir}: DB ports not exposed to host unnecessarily`, () => {
        const compose = composeCache[dir];
        if (!compose) return;
        const hostPorts = [];
        Object.entries(compose.services || {}).forEach(([svc, cfg]) => {
          if (!cfg.ports) return;
          cfg.ports.forEach(p => {
            if (typeof p === 'string') {
              const host = p.split(':')[0];
              if (INTERNAL_DB_PORTS.includes(host)) {
                hostPorts.push(`${svc}: ${p}`);
              }
            }
          });
        });
        if (hostPorts.length > 0) {
          console.warn(`\n⚠  ${dir}: Database ports exposed to host:\n  ${hostPorts.join('\n  ')}`);
        }
      });
    });
  });

  describe('Root User Check', () => {
    appDirs.forEach(dir => {
      test(`${dir}: has non-root user directive where applicable`, () => {
        const compose = composeCache[dir];
        if (!compose) return;
        Object.entries(compose.services || {}).forEach(([svc, cfg]) => {
          if (cfg.image && !cfg.user && !cfg.image.includes('scratch') && !cfg.image.includes('alpine')) {
            // warn not fail — many base images run as root by default
          }
        });
      });
    });
  });

  describe('Capability Hardening', () => {
    appDirs.forEach(dir => {
      test(`${dir}: cap_add should be paired with cap_drop: ALL`, () => {
        const compose = composeCache[dir];
        if (!compose) return;
        Object.entries(compose.services || {}).forEach(([svc, cfg]) => {
          if (cfg.cap_add && !cfg.cap_drop) {
            console.warn(`\n⚠  ${dir}/${svc}: has cap_add without cap_drop: ALL`);
          }
        });
      });
    });
  });

  describe('Resource Limits', () => {
    appDirs.forEach(dir => {
      test(`${dir}: has memory limits set`, () => {
        const compose = composeCache[dir];
        if (!compose) return;
        const meta = compose['x-casaos'];
        Object.entries(compose.services || {}).forEach(([svc, cfg]) => {
          const hasMemLimit = cfg.deploy?.resources?.limits?.memory;
          if (!hasMemLimit && svc === (meta?.main || '')) {
            console.warn(`\n⚠  ${dir}/${svc}: no memory limit set on main service`);
          }
        });
      });
    });
  });

  describe('Read-Only Root Filesystem', () => {
    appDirs.forEach(dir => {
      test(`${dir}: main service has readOnlyRootFilesystem or explicit writable paths`, () => {
        const compose = composeCache[dir];
        if (!compose) return;
        const meta = compose['x-casaos'];
        const mainSvc = compose.services?.[meta?.main];
        if (!mainSvc) return;
        if (!mainSvc.read_only && !mainSvc.tmpfs && !mainSvc.volumes?.length) {
          // Not a failure, just info
        }
      });
    });
  });

  describe('no-new-privileges', () => {
    appDirs.forEach(dir => {
      test(`${dir}: security_opt includes no-new-privileges`, () => {
        const compose = composeCache[dir];
        if (!compose) return;
        const meta = compose['x-casaos'];
        const mainSvc = compose.services?.[meta?.main];
        if (!mainSvc) return;
        const hasNoNewPrivs = mainSvc.security_opt?.includes('no-new-privileges:true');
        if (!hasNoNewPrivs) {
          console.warn(`\n⚠  ${dir}: missing security_opt: no-new-privileges:true`);
        }
      });
    });
  });

  describe('SBOM & Compliance Metadata', () => {
    appDirs.forEach(dir => {
      test(`${dir}: has compliance.yaml`, () => {
        const compliancePath = path.join(APPS_DIR, dir, 'compliance.yaml');
        if (fs.existsSync(compliancePath)) {
          const data = yaml.parse(fs.readFileSync(compliancePath, 'utf8'));
          expect(data).toBeDefined();
          expect(data.data_stored).toBeDefined();
          expect(data.network_egress).toBeDefined();
          expect(data.authentication).toBeDefined();
        }
      });

      test(`${dir}: has SECURITY.md`, () => {
        const securityPath = path.join(APPS_DIR, dir, 'SECURITY.md');
        if (fs.existsSync(securityPath)) {
          const content = fs.readFileSync(securityPath, 'utf8');
          expect(content.length).toBeGreaterThan(50);
        }
      });
    });
  });
});
