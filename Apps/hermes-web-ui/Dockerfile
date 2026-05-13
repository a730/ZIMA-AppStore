ARG BASE_IMAGE=nousresearch/hermes-agent:latest
FROM ${BASE_IMAGE}

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

RUN ARCH=$(dpkg --print-architecture) \
    && if [ "$ARCH" = "amd64" ]; then NODE_ARCH="x64"; else NODE_ARCH="$ARCH"; fi \
    && curl -fsSL "https://nodejs.org/dist/v23.11.0/node-v23.11.0-linux-${NODE_ARCH}.tar.gz" \
       -o /tmp/node.tar.gz \
    && tar -xzf /tmp/node.tar.gz -C /usr/local --strip-components=1 \
    && rm -f /tmp/node.tar.gz \
    && node --version

WORKDIR /app

COPY package*.json ./
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN npm install --ignore-scripts && npm rebuild node-pty

COPY . .

RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production
ENV HOME=/home/agent
ENV HERMES_HOME=/home/agent/.hermes

EXPOSE 6060

ENTRYPOINT ["node", "dist/server/index.js"]
CMD []
