FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    git \
    build-essential \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --upgrade pip

ENV VLLM_TARGET_DEVICE=openvino
ENV PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu

RUN VLLM_TARGET_DEVICE=openvino PIP_EXTRA_INDEX_URL=https://download.pytorch.org/whl/cpu \
    pip install --no-cache-dir vllm==0.8.4

RUN python3 -m pip uninstall -y triton 2>/dev/null; exit 0

ENV VLLM_OPENVINO_DEVICE=CPU
ENV VLLM_CPU_KVCACHE_SPACE=40
ENV VLLM_CPU_OMP_THREADS_BIND=close
ENV COLUMNS=80

EXPOSE 8000

ENTRYPOINT ["python3", "-m", "vllm.entrypoints.openai.api_server"]
