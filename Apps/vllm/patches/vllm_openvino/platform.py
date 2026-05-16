# SPDX-License-Identifier: Apache-2.0

import os
from datetime import timedelta
from typing import TYPE_CHECKING, Any, Optional

import torch
from vllm.logger import init_logger
from vllm.platforms.interface import Platform, PlatformEnum
from vllm.v1.attention.backends.registry import AttentionBackendEnum

import vllm_openvino.envs as envs

if TYPE_CHECKING:
    from vllm.config import VllmConfig
    from torch.distributed import PrefixStore, ProcessGroup
else:
    VllmConfig = None

logger = init_logger(__name__)

try:
    import openvino as ov
    import openvino.properties.hint as hints
except ImportError as e:
    logger.warning("Failed to import OpenVINO with %r", e)


class OpenVinoPlatform(Platform):
    _enum = PlatformEnum.OOT
    device_name: str = "openvino"
    device_type: str = "cpu"
    dispatch_key: str = "CPU"

    @classmethod
    def get_attn_backend_cls(
        cls,
        selected_backend: AttentionBackendEnum,
        attn_selector_config: "AttentionSelectorConfig",
        num_heads: int | None = None,
    ) -> str:
        logger.info("Using OpenVINO Attention backend.")
        if selected_backend is not None:
            logger.info("OpenVINO platform does not support custom attention backends; "
                        "falling back to CPU_ATTN.")
        return AttentionBackendEnum.CPU_ATTN.get_path()

    @classmethod
    def get_device_name(cls, device_id: int = 0) -> str:
        return "openvino"

    @classmethod
    def get_device_uuid(cls, device_id: int = 0) -> str:
        return f"openvino-cpu-{device_id}"

    @classmethod
    def get_device_total_memory(cls, device_id: int = 0) -> int:
        import psutil
        return psutil.virtual_memory().total

    @classmethod
    def inference_mode(cls):
        return torch.inference_mode(mode=True)

    @classmethod
    def is_openvino_cpu(cls) -> bool:
        return "CPU" in envs.VLLM_OPENVINO_DEVICE

    @classmethod
    def is_openvino_gpu(cls) -> bool:
        return "GPU" in envs.VLLM_OPENVINO_DEVICE

    @classmethod
    def is_pin_memory_available(cls) -> bool:
        logger.warning("Pin memory is not supported on OpenVINO.")
        return False

    @classmethod
    def set_device(cls, device: torch.device) -> None:
        pass

    @classmethod
    def check_and_update_config(cls, vllm_config: VllmConfig) -> None:
        from vllm.utils import GiB_bytes

        parallel_config = vllm_config.parallel_config
        assert (parallel_config.world_size == 1
                ), "OpenVINO only supports single CPU socket currently."

        if parallel_config.worker_cls == "auto":
            parallel_config.worker_cls = \
                "vllm_openvino.worker_v1.openvino_worker_v1.OpenVINOWorkerV1"

        model_config = vllm_config.model_config
        if not model_config.enforce_eager:
            logger.warning(
                "CUDA graph is not supported on OpenVINO backend, fallback to "
                "the eager mode.")
            model_config.enforce_eager = True

        ov_core = ov.Core()
        cache_config = vllm_config.cache_config
        if cache_config and cache_config.block_size is None:
            cache_config.block_size = 16

        if envs.VLLM_OPENVINO_KV_CACHE_PRECISION == "u8":
            logger.info("KV cache type is overridden to u8 via "
                        "VLLM_OPENVINO_KV_CACHE_PRECISION env var.")
            cache_config.cache_dtype = "u8"
        elif envs.VLLM_OPENVINO_KV_CACHE_PRECISION == "i8":
            logger.info("KV cache type is overridden to i8 via "
                        "VLLM_OPENVINO_KV_CACHE_PRECISION env var.")
            cache_config.cache_dtype = "i8"
        elif envs.VLLM_OPENVINO_KV_CACHE_PRECISION in ("f16", "fp16"):
            logger.info("KV cache type is overridden to fp16 via "
                        "VLLM_OPENVINO_KV_CACHE_PRECISION env var.")
            cache_config.cache_dtype = "f16"
        elif envs.VLLM_OPENVINO_KV_CACHE_PRECISION == "bf16":
            logger.info("KV cache type is overridden to bf16 via "
                        "VLLM_OPENVINO_KV_CACHE_PRECISION env var.")
            cache_config.cache_dtype = "bf16"
        elif envs.VLLM_OPENVINO_KV_CACHE_PRECISION in ("fp32", "f32"):
            logger.info("KV cache type is overridden to f32 via "
                        "VLLM_OPENVINO_KV_CACHE_PRECISION env var.")
            cache_config.cache_dtype = "f32"
        else:
            logger.info("KV cache type is not specified via "
                        "VLLM_OPENVINO_KV_CACHE_PRECISION env var. "
                        "It will be determined automatically by a plugin")
            cache_config.cache_dtype = "dynamic"

        if OpenVinoPlatform.is_openvino_cpu():
            if cache_config.block_size != 32:
                logger.info(
                    f"OpenVINO CPU optimal block size is 32, overriding currently set {cache_config.block_size}"
                )
                cache_config.block_size = 32
        else:
            if cache_config.block_size != 16:
                logger.info(
                    f"OpenVINO GPU optimal block size is 16, overriding currently set {cache_config.block_size}"
                )
                cache_config.block_size = 16

        kv_cache_space = envs.VLLM_OPENVINO_KVCACHE_SPACE
        if kv_cache_space >= 0:
            if kv_cache_space == 0 and OpenVinoPlatform.is_openvino_cpu():
                cache_config.openvino_kvcache_space_bytes = 4 * GiB_bytes
                logger.warning(
                    "Environment variable VLLM_OPENVINO_KVCACHE_SPACE (GB) "
                    "for OpenVINO backend is not set, using 4 by default.")
            else:
                cache_config.openvino_kvcache_space_bytes = (
                    kv_cache_space * GiB_bytes)
        else:
            raise RuntimeError(
                "Invalid environment variable VLLM_OPENVINO_KVCACHE_SPACE"
                f" {kv_cache_space}, expect a positive integer value.")

        assert vllm_config.device_config.device_type == "cpu"
        assert vllm_config.lora_config is None, \
            "OpenVINO backend doesn't support LoRA"
        assert cls.is_openvino_cpu() or \
            cls.is_openvino_gpu(), \
            "OpenVINO backend supports only CPU and GPU devices"

    @classmethod
    def check_if_supports_dtype(cls, dtype: torch.dtype):
        supported = [torch.bfloat16, torch.float32]
        if dtype not in supported:
            raise ValueError(
                f"Unsupported dtype {dtype} for OpenVINO platform. "
                f"Supported: {supported}")

    @classmethod
    def num_compute_units(cls, device_id: int = 0) -> int:
        return os.cpu_count() or 1

    @classmethod
    def get_current_memory_usage(cls, device: torch.types.Device | None = None) -> float:
        import psutil
        return psutil.Process().memory_info().rss

    @classmethod
    def get_punica_wrapper(cls) -> str:
        raise NotImplementedError("Punica wrapper is not supported on OpenVINO.")

    @classmethod
    def check_max_model_len(cls, max_model_len: int) -> int:
        return max_model_len

    @classmethod
    def stateless_init_device_torch_dist_pg(
        cls,
        backend: str,
        prefix_store: "PrefixStore",
        group_rank: int,
        group_size: int,
        timeout: timedelta,
    ) -> "ProcessGroup":
        from torch.distributed import ProcessGroupGloo
        pg = ProcessGroupGloo(
            prefix_store,
            group_rank,
            group_size,
            timeout=timeout,
        )
        return pg
