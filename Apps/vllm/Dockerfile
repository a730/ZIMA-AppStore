FROM python:3.12-slim AS builder

ARG VLLM_VERSION=v0.8.4
ARG MAX_JOBS=16

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    ninja-build \
    libopenblas-dev \
    && rm -rf /var/lib/apt/lists/*

RUN git clone --depth 1 --branch ${VLLM_VERSION} https://github.com/vllm-project/vllm.git /vllm
WORKDIR /vllm

RUN pip install --upgrade pip && \
    pip install wheel setuptools && \
    pip install torch --extra-index-url https://download.pytorch.org/whl/cpu

ENV VLLM_TARGET_DEVICE=openvino
ENV MAX_JOBS=${MAX_JOBS}
RUN pip install -e .

FROM python:3.12-slim

RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    libopenblas0 \
    ocl-icd-libopencl1 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /vllm /vllm
COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

ENV VLLM_TARGET_DEVICE=openvino
ENV VLLM_OPENVINO_DEVICE=CPU
ENV VLLM_CPU_KVCACHE_SPACE=40
ENV VLLM_CPU_AVX2=1
ENV VLLM_CPU_OMP_THREADS_BIND=close

ENV COLUMNS=80
EXPOSE 8000

ENTRYPOINT ["python3", "-m", "vllm.entrypoints.openai.api_server"]
