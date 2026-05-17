# SGLang (AVX2 CPU)

[SGLang](https://github.com/sgl-project/sglang) is a high-performance serving framework for large language models.

This build is compiled from source with **`-march=znver2`** (AVX2) optimization for **AMD Zen2 CPUs** (Threadripper 3970X and similar).

## Features

- CPU-only inference (no GPU required)
- Compiled with Zen2/AVX2 optimizations
- Latest `transformers` for bleeding-edge model support
- W8A8_INT8 quantization support for better CPU performance
- Tensor parallelism across CPU cores (`--tp 4` default)
- OpenAI-compatible API at `/v1/completions` and `/v1/chat/completions`

## Usage

### Quick Start

1. Install from CasaOS App Store
2. Set `MODEL_ID` to your desired HuggingFace model (supports Qwen3.6, Gemma4, Zyphra/ZAYA1-8B)
3. For gated models, set `HF_TOKEN`
4. Wait for model download on first boot

### Recommended Models

| Model | Precision | RAM Needed | Quality | Speed |
|-------|-----------|------------|---------|-------|
| Zyphra/ZAYA1-8B | BF16 | ~17 GB | High | Fast |
| google/gemma-4-26b-it | BF16 | ~52 GB | Very High | Moderate |
| Qwen/Qwen3.6-35B-A3B | BF16 | ~70 GB | Highest | Moderate |
| RedHatAI/QwQ-32B-quantized.w8a8 | W8A8_INT8 | ~32 GB | High | Fastest |

For best CPU performance, use W8A8_INT8 quantized models and set `QUANTIZATION=w8a8_int8`.

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MODEL_ID` | `Qwen/Qwen3.6-35B-A3B` | HuggingFace model ID |
| `NUM_TP` | `4` | Tensor parallel ranks |
| `QUANTIZATION` | *(empty)* | Set to `w8a8_int8` for W8A8 models |
| `ENABLE_TORCH_COMPILE` | `true` | Enable torch.compile optimization |
| `TORCH_COMPILE_MAX_BS` | `4` | Max batch size for torch.compile |
| `MAX_TOTAL_TOKENS` | `32768` | Maximum tokens in KV cache |
| `HF_TOKEN` | *(empty)* | HuggingFace token for gated models |

### API Access

```bash
curl http://localhost:8004/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "Qwen/Qwen3.6-35B-A3B",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

## Build Notes

Built from SGLang `v0.5.11` source with:
- `-march=znver2` (AMD Zen2 AVX2 optimization)
- PyTorch CPU backend (no CUDA)
- `transformers` upgraded to latest release
- W8A8_INT8, AWQ, GPTQ quantization support

## Performance Tuning

For Threadripper 3970X (32C/64T):
- **TP=4**: Uses 4 CCX modules, 8 cores each with 16 MB L3
- **TP=2**: Uses 2 NUMA nodes, 16 cores each
- Set `CPU_OMP_THREADS_BIND` for explicit core binding if needed

## License

Apache 2.0
