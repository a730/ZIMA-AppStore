FROM lmsysorg/sglang:v0.5.11-cu129-runtime

RUN mkdir -p /root/tiktoken_encodings && \
    wget -q -O /root/tiktoken_encodings/o200k_base.tiktoken \
    "https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken"

ENV TIKTOKEN_ENCODINGS=/root/tiktoken_encodings

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8000
ENTRYPOINT ["/entrypoint.sh"]
