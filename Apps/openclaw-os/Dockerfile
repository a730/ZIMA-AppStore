ARG NODE_BOOKWORM_IMAGE=node:24-bookworm
ARG NODE_BOOKWORM_SLIM_IMAGE=node:24-bookworm-slim

# Stage 1: Build openclaw-os plugin
FROM ${NODE_BOOKWORM_IMAGE} AS plugin-builder
WORKDIR /app
RUN git clone --depth=1 https://github.com/thesysdev/openclaw-os.git .
RUN corepack enable && corepack prepare pnpm@9 --activate && \
    pnpm install --frozen-lockfile && pnpm -r build

# Stage 2: Build OpenClaw gateway with plugin injected
FROM ${NODE_BOOKWORM_IMAGE} AS gateway-builder
WORKDIR /app
RUN git clone --depth=1 https://github.com/openclaw/openclaw.git .

COPY --from=plugin-builder /app/packages/claw-plugin /app/extensions/openclaw-os

RUN corepack enable && corepack prepare pnpm@9 --activate

RUN --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
    NODE_OPTIONS=--max-old-space-size=2048 pnpm install --no-frozen-lockfile \
      --config.supportedArchitectures.os=linux \
      --config.supportedArchitectures.cpu="$(node -p 'process.arch')" \
      --config.supportedArchitectures.libc=glibc \
      --config.minimumReleaseAge=0

RUN NODE_OPTIONS=--max-old-space-size=8192 pnpm build:docker

ENV OPENCLAW_PREFER_PNPM=1
RUN pnpm ui:build

# Stage 3: Prune dev dependencies for runtime
FROM gateway-builder AS runtime-assets
RUN --mount=type=cache,target=/root/.local/share/pnpm/store,sharing=locked \
    CI=true pnpm prune --prod \
      --config.offline=true \
      --config.supportedArchitectures.os=linux \
      --config.supportedArchitectures.cpu="$(node -p 'process.arch')" \
      --config.supportedArchitectures.libc=glibc \
      --config.minimumReleaseAge=0

# Stage 4: Runtime image
FROM ${NODE_BOOKWORM_SLIM_IMAGE}
WORKDIR /app

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      ca-certificates curl git hostname lsof openssl procps python3 tini && \
    update-ca-certificates && \
    rm -rf /var/lib/apt/lists/*

RUN chown node:node /app

COPY --from=runtime-assets --chown=node:node /app/dist ./dist
COPY --from=runtime-assets --chown=node:node /app/node_modules ./node_modules
COPY --from=runtime-assets --chown=node:node /app/package.json .
COPY --from=runtime-assets --chown=node:node /app/pnpm-workspace.yaml .
COPY --from=runtime-assets --chown=node:node /app/openclaw.mjs .
COPY --from=runtime-assets --chown=node:node /app/extensions ./extensions
COPY --from=runtime-assets --chown=node:node /app/skills ./skills

ENV COREPACK_HOME=/usr/local/share/corepack
RUN install -d -m 0755 "$COREPACK_HOME" && corepack enable

RUN ln -sf /app/openclaw.mjs /usr/local/bin/openclaw && chmod 755 /app/openclaw.mjs

RUN install -d -m 0700 -o node -g node /home/node/.openclaw

ENV NODE_ENV=production
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD node -e "fetch('http://127.0.0.1:18789/healthz').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["tini", "-s", "--"]
CMD ["node", "openclaw.mjs", "gateway", "--allow-unconfigured"]
