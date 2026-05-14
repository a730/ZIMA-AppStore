const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const APPS_DIR = path.join(__dirname, '..');

function getAppDirs() {
  return fs.readdirSync(APPS_DIR)
    .filter(f => fs.statSync(path.join(APPS_DIR, f)).isDirectory())
    .filter(f => f !== '__tests__');
}

function readCompose(appDir) {
  const composePath = path.join(APPS_DIR, appDir, 'docker-compose.yml');
  if (!fs.existsSync(composePath)) {
    return null;
  }
  return yaml.parse(fs.readFileSync(composePath, 'utf8'));
}

describe('App Store Validation', () => {
  const appDirs = getAppDirs();
  if (appDirs.length === 0) {
    throw new Error('No app directories found!');
  }

  test('all apps have docker-compose.yml', () => {
    const missing = appDirs.filter(d => !fs.existsSync(path.join(APPS_DIR, d, 'docker-compose.yml')));
    expect(missing).toEqual([]);
  });

  test('all apps have logo.png', () => {
    const missing = appDirs.filter(d => !fs.existsSync(path.join(APPS_DIR, d, 'logo.png')));
    expect(missing).toEqual([]);
  });

  test('all apps have valid YAML in docker-compose.yml', () => {
    appDirs.forEach(dir => {
      const compose = readCompose(dir);
      expect(compose).not.toBeNull();
      expect(typeof compose).toBe('object');
    });
  });

  test('no orphan compose files in Apps/ root', () => {
    const rootFiles = fs.readdirSync(APPS_DIR)
      .filter(f => f.endsWith('.yml') || f.endsWith('.yaml'));
    expect(rootFiles).toEqual([]);
  });

  test('all compose files use .yml extension (not .yaml)', () => {
    const yamlFiles = fs.readdirSync(APPS_DIR, { recursive: true })
      .filter(f => f.endsWith('.yaml'));
    expect(yamlFiles).toEqual([]);
  });

  describe('x-casaos metadata checks', () => {
    appDirs.forEach(dir => {
      const compose = readCompose(dir);
      if (!compose) return;

      test(`${dir}: has x-casaos section`, () => {
        expect(compose['x-casaos']).toBeDefined();
      });

      const meta = compose['x-casaos'] || {};

      test(`${dir}: has main service reference`, () => {
        expect(meta.main).toBeDefined();
        expect(typeof meta.main).toBe('string');
      });

      test(`${dir}: main service exists in services`, () => {
        if (!meta.main) return;
        expect(compose.services[meta.main]).toBeDefined();
      });

      test(`${dir}: has title`, () => {
        expect(meta.title?.en_us).toBeDefined();
        expect(typeof meta.title.en_us).toBe('string');
        expect(meta.title.en_us.length).toBeGreaterThan(0);
      });

      test(`${dir}: has description`, () => {
        expect(meta.description?.en_us).toBeDefined();
        expect(typeof meta.description.en_us).toBe('string');
        expect(meta.description.en_us.length).toBeGreaterThan(10);
      });

      test(`${dir}: has tagline`, () => {
        expect(meta.tagline?.en_us).toBeDefined();
        expect(typeof meta.tagline.en_us).toBe('string');
        expect(meta.tagline.en_us.length).toBeGreaterThan(0);
      });

      test(`${dir}: has developer`, () => {
        expect(meta.developer).toBeDefined();
        expect(typeof meta.developer).toBe('string');
        expect(meta.developer.length).toBeGreaterThan(0);
      });

      test(`${dir}: has category`, () => {
        expect(meta.category).toBeDefined();
      });

      test(`${dir}: has port_map matching casaos.port`, () => {
        const portMap = meta.port_map;
        const mainService = compose.services[meta.main];
        if (!mainService) return;
        const labels = mainService.labels || [];
        const casaosPort = labels
          .filter(l => l.startsWith('casaos.port='))
          .map(l => l.split('=')[1])[0];
        if (casaosPort) {
          expect(portMap).toBe(casaosPort);
        }
      });

      test(`${dir}: has healthcheck on main service`, () => {
        const mainService = compose.services[meta.main];
        if (!mainService) return;
        expect(mainService.healthcheck).toBeDefined();
      });

      test(`${dir}: no orphan version key`, () => {
        expect(compose.version).toBeUndefined();
      });
    });
  });
});