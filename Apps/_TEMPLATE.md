# App Store Template — Working Reference

Use this template and checklist when adding a new app to avoid the issues discovered with HermesHQ.

## Directory Structure

```
Apps/your-app/
├── docker-compose.yml    # REQUIRED - app manifest
├── logo.png              # REQUIRED - app icon (square, ~256x256)
├── thumbnail.png         # RECOMMENDED - store thumbnail
├── README.md             # RECOMMENDED
└── screenshot-1.png      # OPTIONAL - up to 5
```

## DO's and DON'Ts

### ✅ DO
- Use `network_mode: bridge` on the main service
- Add a `healthcheck` to the main service
- Set `main:` to match the `container_name:` (NOT the service name)
  - e.g. service `frontend`, container `hermeshq-frontend` → `main: hermeshq-frontend`
- Quote environment variable values as YAML strings: `KEY: 'value here'`
  - Never use YAML flow sequences: `KEY: ["a","b"]` ← BROKEN
- Add `casaos.port`, `casaos.protocol`, `casaos.entrypoint` labels on the main service
- Include `logo.png` in the app directory

### ❌ DON'T
- Don't leave orphan `docker-compose.yml` files in `Apps/` root (triggers single-file mode, hides ALL apps)
- Don't leave dev-only `.yml` files without `x-casaos` in `Apps/` root
- Don't use custom Docker networks (`networks:` block) — CasaOS expects bridge networking
- Don't skip the healthcheck
- Don't set `main:` to the service name if it differs from container_name

## Registry Files

After creating the app directory, register it in these root-level JSON files:

| File | Purpose |
|------|---------|
| `featured-apps.json` | Featured on landing page (optional) |
| `recommend-list.json` | Recommended apps (optional) |
| `category-list.json` | Category mapping (optional, only if new category) |

---

## Skeleton `docker-compose.yml`

```yaml
version: "3.7"
name: your-app

services:
  your-app-main:
    container_name: YourApp          # <-- main: must match THIS
    image: your/image:tag
    ports:
      - "PORT:CONTAINER_PORT"
    labels:
      - "casaos.port=PORT"           # same as host port above
      - "casaos.protocol=http"
      - "casaos.entrypoint=/"
    healthcheck:                     # REQUIRED
      test: ["CMD", "curl", "-f", "http://localhost:CONTAINER_PORT"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    network_mode: bridge             # REQUIRED - DO NOT use custom networks
    restart: unless-stopped
    environment:
      SOME_KEY: 'some value'         # always quote env values
    volumes:
      - /DATA/AppData/YourApp/data:/app/data
    x-casaos:
      envs:
        - container: SOME_KEY
          description:
            en_us: Description for CasaOS UI
      volumes:
        - container: /app/data
          description:
            en_us: Data storage

  # Optional: database service
  postgres:
    container_name: your-app-postgres
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_DB: yourdb
      POSTGRES_USER: youruser
      POSTGRES_PASSWORD: yourpass
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U youruser -d yourdb"]
      interval: 5s
      timeout: 5s
      retries: 12
    volumes:
      - /DATA/AppData/YourApp/postgres:/var/lib/postgresql/data
    x-casaos:
      volumes:
        - container: /var/lib/postgresql/data
          description:
            en_us: PostgreSQL data directory

x-casaos:
  architectures:
    - amd64
    - arm64
  main: YourApp                      # MUST match container_name above
  description:
    en_us: Short description of what the app does.
  tagline:
    en_us: One-line tagline
  developer: developer-name
  author: store-maintainer-name
  icon: https://raw.githubusercontent.com/a730/ZIMA-AppStore/main/Apps/your-app/logo.png
  thumbnail: https://raw.githubusercontent.com/a730/ZIMA-AppStore/main/Apps/your-app/logo.png
  title:
    en_us: Your App
  category: Generative AI            # Use existing category if possible
  port_map: "PORT"                   # must match casaos.port
  scheme: http
  index: /
  # Optional:
  # screenshots:
  #   - https://raw.githubusercontent.com/a730/ZIMA-AppStore/main/Apps/your-app/screenshot-1.png
  # tips:
  #   before_install:
  #     en_us: |
  #       Any pre-install notes for the user.
```

## Quick Checklist

- [ ] No orphan `docker-compose.yml` in `Apps/` root
- [ ] No orphan `.yml` files in `Apps/` root
- [ ] `network_mode: bridge` on main service
- [ ] `healthcheck` on main service
- [ ] `main:` matches `container_name` (not service name)
- [ ] All env values are quoted strings (no YAML lists)
- [ ] `casaos.port`, `casaos.protocol`, `casaos.entrypoint` labels on main service
- [ ] `icon:` URL uses correct repo path
- [ ] `port_map:` matches `casaos.port`
- [ ] `logo.png` exists in app directory
- [ ] No custom `networks:` blocks
- [ ] Valid YAML syntax (`python3 -c "import yaml; yaml.safe_load(open('Apps/your-app/docker-compose.yml'))"`)
- [ ] Registered in `featured-apps.json` / `recommend-list.json` (if desired)
