# SGLang (CUDA)

High-performance LLM and VLM inference serving for NVIDIA GPUs.

## Features
- OpenAI-compatible API
- GPT-OSS-20B default model with MXFP4 native quantization
- HiCache CPU RAM KV cache offloading for larger contexts
- Supports multiple models: Zyphra/ZAYA1-8B, Qwen3.6, Gemma4
- PagedAttention, RadixAttention prefix caching
- Continuous batching, structured outputs

## Installation
Install via ZimaOS App Store.
Requires NVIDIA GPU with CUDA 12 support (e.g., RTX 2000 Ada).

## Default Model
- `openai/gpt-oss-20b` — 20.9B total / 3.6B active, MXFP4 quantized
- ~12.8 GB checkpoint, fits RTX 2000 Ada (16 GB) with 32K context
- 139 tok/s on RTX 4080 16GB, ~60-100 tok/s on RTX 2000 Ada
