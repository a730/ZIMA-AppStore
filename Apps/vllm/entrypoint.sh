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

        # Workaround for gpt-oss models that lack max_position_embeddings
        # in config.json (needed by transformers>=5.x RoPE standardization).
        MODEL_LC=$(echo "$MODEL_ARG" | tr '[:upper:]' '[:lower:]')
        if echo "$MODEL_LC" | grep -q "gpt-oss"; then
            echo "=== Detected gpt-oss model; patching config max_position_embeddings ==="
            PATCH_DIR=$(mktemp -d)
            HF_HUB_ENABLE_HF_TRANSFER=1 huggingface-cli download "$MODEL_ARG" \
                --local-dir "$PATCH_DIR" --include "config.json" 2>/dev/null || true
            if [ -f "$PATCH_DIR/config.json" ]; then
                python3 -c "
import json
with open('$PATCH_DIR/config.json') as f:
    cfg = json.load(f)
if 'max_position_embeddings' not in cfg:
    cfg['max_position_embeddings'] = cfg.get('n_positions', cfg.get('max_sequence_length', 2048))
    with open('$PATCH_DIR/config.json', 'w') as f:
        json.dump(cfg, f, indent=2)
    print('Patched max_position_embeddings:', cfg['max_position_embeddings'])
"
                optimum-cli export openvino --model "$PATCH_DIR" \
                    --weight-format "$WEIGHT_FORMAT" "$QUANT_PATH"
                rm -rf "$PATCH_DIR"
            else
                optimum-cli export openvino --model "$MODEL_ARG" \
                    --weight-format "$WEIGHT_FORMAT" "$QUANT_PATH"
            fi
        else
            optimum-cli export openvino --model "$MODEL_ARG" \
                --weight-format "$WEIGHT_FORMAT" "$QUANT_PATH"
        fi

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
