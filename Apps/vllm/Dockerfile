FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y \
    git \
    curl \
    ca-certificates \
    build-essential \
    python3-dev \
    cmake \
    ninja-build \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

# Clone upstream vllm-openvino plugin @ v0.8.4 (last release with V0 engine)
RUN git clone --depth 1 --branch v0.8.4 \
    https://github.com/vllm-project/vllm-openvino.git /src

# Apply patches to adapt plugin to vLLM v0.19 API
COPY patches /patches
RUN cp /patches/pyproject.toml /src/ \
    && cp /patches/vllm_openvino/platform.py /src/vllm_openvino/ \
    && cp /patches/vllm_openvino/model_executor/model_loader/openvino.py /src/vllm_openvino/model_executor/model_loader/ \
    && cp /patches/vllm_openvino/worker_v1/openvino_worker_v1.py /src/vllm_openvino/worker_v1/ \
    && cp /patches/vllm_openvino/worker_v1/openvino_model_runner_v1.py /src/vllm_openvino/worker_v1/ \
    && cp /patches/vllm_openvino/worker/openvino_worker.py /src/vllm_openvino/worker/ \
    && cp /patches/vllm_openvino/worker/openvino_model_runner.py /src/vllm_openvino/worker/ \
    && cp /patches/vllm_openvino/attention/backends/openvino.py /src/vllm_openvino/attention/backends/

# Build plugin with v0.19 deps (pinned in patched pyproject.toml)
RUN cd /src \
    && VLLM_TARGET_DEVICE="empty" \
       PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu \
       pip install -v . --no-cache-dir \
    && pip install --upgrade safetensors \
    && pip install "transformers>=5.5.0" \
    && pip install --no-deps "optimum-intel[nncf] @ git+https://github.com/huggingface/optimum-intel.git" \
    && pip install --no-deps git+https://github.com/huggingface/optimum.git \
    && pip install --no-deps "optimum-onnx @ git+https://github.com/huggingface/optimum-onnx.git@transformers-v5"

# Remove triton if inadvertently installed
RUN python3 -m pip uninstall -y triton 2>/dev/null; exit 0

FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

ENV VLLM_OPENVINO_DEVICE=CPU
ENV VLLM_CPU_KVCACHE_SPACE=40
ENV VLLM_CPU_OMP_THREADS_BIND=close
ENV COLUMNS=80
ENV VLLM_OPENVINO_ENABLE_QUANTIZED_WEIGHTS=ON
ENV VLLM_OPENVINO_KV_CACHE_PRECISION=u8

EXPOSE 8000

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
