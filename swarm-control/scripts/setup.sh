#!/usr/bin/env bash
set -euo pipefail

echo "╔══════════════════════════════════════════╗"
echo "║     SwarmControl — Combined Setup        ║"
echo "╚══════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# --- Generate .env if missing ---
if [ ! -f .env ]; then
  echo "Creating .env from .env.example..."
  cp .env.example .env

  # Generate random credentials
  if [[ "$OSTYPE" == "darwin"* ]] || command -v openssl &>/dev/null; then
    MC_AUTH_PASS=$(openssl rand -base64 12 | tr -dc 'a-zA-Z0-9' | head -c16)
    MC_API_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c32)
    SWARMCLAW_API_KEY=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c32)

    sed -i.bak "s/MC_AUTH_PASS=.*/MC_AUTH_PASS=$MC_AUTH_PASS/" .env
    sed -i.bak "s/MC_API_KEY=.*/MC_API_KEY=$MC_API_KEY/" .env
    sed -i.bak "s/SWARMCLAW_API_KEY=.*/SWARMCLAW_API_KEY=$SWARMCLAW_API_KEY/" .env
    rm -f .env.bak
  fi
else
  echo ".env already exists, skipping generation"
fi

echo ""
echo "Credentials:"
echo "  Mission Control UI: http://localhost:${MC_PORT:-3000}"
echo "  Login:             $(grep MC_AUTH_USER .env 2>/dev/null | cut -d= -f2 || echo 'admin')"
echo "  Password:          $(grep MC_AUTH_PASS .env 2>/dev/null | cut -d= -f2 || echo '<check .env>')"
echo ""
echo "  SwarmClaw UI:      http://localhost:3456"
echo "  API Key:           $(grep SWARMCLAW_API_KEY .env 2>/dev/null | cut -d= -f2 || echo 'auto')"
echo ""
echo "  Gateway Bridge:    ws://localhost:${GATEWAY_BRIDGE_PORT:-18789}"
echo ""

# --- Check Docker ---
if ! command -v docker &>/dev/null; then
  echo "ERROR: Docker is not installed. Please install Docker first."
  exit 1
fi

if ! docker compose version &>/dev/null; then
  echo "ERROR: docker compose is not available."
  exit 1
fi

echo "Starting services..."
docker compose up -d --build

echo ""
echo "Waiting for services to be ready..."
sleep 10

echo "Checking health..."
if curl -sf http://localhost:3456/api/healthz >/dev/null 2>&1; then
  echo "  ✓ SwarmClaw is healthy"
else
  echo "  ⚠ SwarmClaw may still be starting up"
fi

if curl -sf http://localhost:${MC_PORT:-3000}/api/status >/dev/null 2>&1; then
  echo "  ✓ Mission Control is ready"
else
  echo "  ⚠ Mission Control may still be starting up"
fi

echo ""
echo "Setup complete! Open:"
echo "  Mission Control: http://localhost:${MC_PORT:-3000}/setup"
echo "  SwarmClaw:       http://localhost:3456"
echo ""
echo "Run 'docker compose logs -f' to follow logs."
