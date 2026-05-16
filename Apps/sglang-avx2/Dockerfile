FROM ubuntu:24.04
SHELL ["/bin/bash", "-c"]

ARG SGLANG_REPO=https://github.com/sgl-project/sglang.git
ARG VER_SGLANG=v0.5.11

RUN apt-get update && \
    apt-get full-upgrade -y && \
    DEBIAN_FRONTEND=noninteractive apt-get install --no-install-recommends -y \
    ca-certificates \
    git \
    curl \
    wget \
    gcc \
    g++ \
    make \
    libsqlite3-dev \
    google-perftools \
    libtbb-dev \
    libnuma-dev \
    numactl && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /opt

RUN curl -LsSf https://astral.sh/uv/install.sh | sh && \
    source $HOME/.local/bin/env && \
    uv venv --python 3.12

RUN echo -e '[[index]]\nname = "torch"\nurl = "https://download.pytorch.org/whl/cpu"\n\n[[index]]\nname = "torchvision"\nurl = "https://download.pytorch.org/whl/cpu"\n\n[[index]]\nname = "torchaudio"\nurl = "https://download.pytorch.org/whl/cpu"\n\n[[index]]\nname = "triton"\nurl = "https://download.pytorch.org/whl/cpu"' > .venv/uv.toml

ENV UV_CONFIG_FILE=/opt/.venv/uv.toml

WORKDIR /sgl-workspace
RUN source $HOME/.local/bin/env && \
    source /opt/.venv/bin/activate && \
    git clone ${SGLANG_REPO} sglang && \
    cd sglang && \
    git checkout ${VER_SGLANG}

RUN sed -i 's/-march=native/-march=znver2/' /sgl-workspace/sglang/sgl-kernel/csrc/cpu/CMakeLists.txt

RUN source $HOME/.local/bin/env && \
    source /opt/.venv/bin/activate && \
    cd /sgl-workspace/sglang/python && \
    cp pyproject_cpu.toml pyproject.toml && \
    uv pip install --upgrade pip setuptools && \
    uv pip install .

RUN source $HOME/.local/bin/env && \
    source /opt/.venv/bin/activate && \
    cd /sgl-workspace/sglang/sgl-kernel && \
    cp pyproject_cpu.toml pyproject.toml && \
    uv pip install .

RUN source /opt/.venv/bin/activate && \
    uv pip install --upgrade transformers

ENV SGLANG_USE_CPU_ENGINE=1
ENV LD_PRELOAD=/usr/lib/x86_64-linux-gnu/libtcmalloc.so.4:/usr/lib/x86_64-linux-gnu/libtbbmalloc.so:/opt/.venv/lib/libiomp5.so

RUN echo 'source /opt/.venv/bin/activate' >> /root/.bashrc

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
