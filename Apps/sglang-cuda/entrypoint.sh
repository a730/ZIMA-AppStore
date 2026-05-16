#!/bin/bash
set -e

MODEL_ID="${MODEL_ID:-openai/gpt-oss-20b}"
MAX_CONTEXT_LENGTH="${MAX_CONTEXT_LENGTH:-32768}"
MEM_FRACTION_STATIC="${MEM_FRACTION_STATIC:-0.85}"
HF_TOKEN="${HF_TOKEN:-}"
ENABLE_HICACHE="${ENABLE_HICACHE:-true}"
HICACHE_SIZE="${HICACHE_SIZE:-16}"

ARGS=(
  --model "$MODEL_ID"
  --context-length "$MAX_CONTEXT_LENGTH"
  --mem-fraction-static "$MEM_FRACTION_STATIC"
  --host 0.0.0.0
  --port 8000
  --trust-remote-code
)

if [ "$ENABLE_HICACHE" = "true" ]; then
  ARGS+=(
    --enable-hierarchical-cache
    --hicache-size "$HICACHE_SIZE"
    --page-size 64
    --hicache-write-policy write_through
  )
fi

MODEL_LOWER=$(echo "$MODEL_ID" | tr '[:upper:]' '[:lower:]')
case "$MODEL_LOWER" in
  *qwen*)
    ARGS+=(--reasoning-parser qwen3 --tool-call-parser qwen3_coder)
    ;;&
  *qwen*|*gemma*)
    ARGS+=(--language-model-only)
    ;;
esac

[ -n "$HF_TOKEN" ] && huggingface-cli login --token "$HF_TOKEN" --add-to-git-credential

ARGS+=("$@")

exec python3 -m sglang.launch_server "${ARGS[@]}"
