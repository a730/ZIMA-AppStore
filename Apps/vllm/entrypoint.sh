#!/bin/bash
set -e

QUANT_CACHE="${VLLM_QUANT_CACHE:-/root/.cache/huggingface/quantized}"
WEIGHT_FORMAT="${VLLM_QUANT_FORMAT:-int4}"
MODEL_ARG=""
ARGS=()

while [ $# -gt 0 ]; do
    case "$1" in
        --model)
            MODEL_ARG="$2"
            ARGS+=("$1" "$2")
            shift 2
            ;;
        *)
            ARGS+=("$1")
            shift
            ;;
    esac
done

if [ -n "$MODEL_ARG" ] && [ ! -d "$MODEL_ARG" ]; then
    SAFE_NAME=$(echo "$MODEL_ARG" | tr '/@:' '_')
    QUANT_PATH="$QUANT_CACHE/${SAFE_NAME}_${WEIGHT_FORMAT}"

    if [ ! -d "$QUANT_PATH" ]; then
        echo "=== Quantizing $MODEL_ARG to $WEIGHT_FORMAT (first run, this may take a while) ==="
        mkdir -p "$(dirname "$QUANT_PATH")"
        optimum-cli export openvino --model "$MODEL_ARG" --weight-format "$WEIGHT_FORMAT" "$QUANT_PATH"
        echo "=== Quantization complete: $QUANT_PATH ==="
    else
        echo "=== Using cached quantized model: $QUANT_PATH ==="
    fi

    for idx in "${!ARGS[@]}"; do
        if [ "${ARGS[$idx]}" = "--model" ]; then
            ARGS[$((idx+1))]="$QUANT_PATH"
            break
        fi
    done
fi

exec python3 -m vllm.entrypoints.openai.api_server "${ARGS[@]}"
