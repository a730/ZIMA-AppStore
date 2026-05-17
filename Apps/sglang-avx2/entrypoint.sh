#!/bin/bash
set -e

source /opt/.venv/bin/activate

MODEL_ID="${MODEL_ID:-Qwen/Qwen3.6-35B-A3B}"
HF_TOKEN="${HF_TOKEN:-}"
NUM_TP="${NUM_TP:-4}"
QUANTIZATION="${QUANTIZATION:-}"
ENABLE_TORCH_COMPILE="${ENABLE_TORCH_COMPILE:-true}"
TORCH_COMPILE_MAX_BS="${TORCH_COMPILE_MAX_BS:-4}"
MAX_TOTAL_TOKENS="${MAX_TOTAL_TOKENS:-32768}"
CPU_OMP_THREADS_BIND="${CPU_OMP_THREADS_BIND:-}"

ARGS=(
  --model "$MODEL_ID"
  --device cpu
  --disable-overlap-schedule
  --trust-remote-code
  --host 0.0.0.0
  --port 8000
  --tp "$NUM_TP"
)

[ -n "$MAX_TOTAL_TOKENS" ] && ARGS+=(--max-total-tokens "$MAX_TOTAL_TOKENS")
[ -n "$QUANTIZATION" ] && ARGS+=(--quantization "$QUANTIZATION")

if [ "$ENABLE_TORCH_COMPILE" = "true" ]; then
  ARGS+=(--enable-torch-compile --torch-compile-max-bs "$TORCH_COMPILE_MAX_BS")
fi

[ -n "$CPU_OMP_THREADS_BIND" ] && export SGLANG_CPU_OMP_THREADS_BIND="$CPU_OMP_THREADS_BIND"

MODEL_LOWER=$(echo "$MODEL_ID" | tr '[:upper:]' '[:lower:]')
case "$MODEL_LOWER" in
  *qwen*)
    ARGS+=(--reasoning-parser qwen3)
    ;;
  *gemma*)
    ARGS+=(--language-model-only)
    ;;
esac

[ -n "$HF_TOKEN" ] && huggingface-cli login --token "$HF_TOKEN" --add-to-git-credential

ARGS+=("$@")

exec python3 -m sglang.launch_server "${ARGS[@]}"
