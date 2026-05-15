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

RUN git clone https://github.com/vllm-project/vllm-openvino.git /src \
    && cd /src

RUN cd /src \
    && VLLM_TARGET_DEVICE="empty" \
       PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu \
       pip install -v . --no-cache-dir \
    && pip install --upgrade safetensors

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

EXPOSE 8000

ENTRYPOINT ["python3", "-m", "vllm.entrypoints.openai.api_server"]
