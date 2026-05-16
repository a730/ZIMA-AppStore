# SPDX-License-Identifier: Apache-2.0
"""OpenVINO cache engine (V1)."""
from typing import List, Tuple

import openvino as ov

import vllm_openvino.envs as envs
from vllm.config import (CacheConfig, DeviceConfig, ModelConfig,
                         ParallelConfig)
from vllm.logger import init_logger
from vllm.platforms import current_platform
from vllm_openvino.attention.backends.openvino import (
    copy_blocks,
    swap_blocks,
)

logger = init_logger(__name__)

str_to_ov_type = {
    "u8": ov.Type.u8,
    "i8": ov.Type.i8,
    "fp16": ov.Type.f16,
    "f16": ov.Type.f16,
    "bf16": ov.Type.bf16,
    "f32": ov.Type.f32,
    "fp32": ov.Type.f32,
    "dynamic": ov.Type.dynamic,
}


class OpenVINOCacheEngine:
    """Manages the KV cache for OpenVINO backend."""

    def __init__(
        self,
        cache_config: CacheConfig,
        key_cache_config: List[ov.PartialShape],
        value_cache_config: List[ov.PartialShape],
        model_config: ModelConfig,
        parallel_config: ParallelConfig,
        device_config: DeviceConfig,
        ov_core: ov.Core,
        ov_device: str,
    ) -> None:
        assert device_config.device_type == "cpu"
        self.cache_config = cache_config
        self.model_config = model_config
        self.parallel_config = parallel_config

        self.key_cache_config = key_cache_config
        self.value_cache_config = value_cache_config
        self.num_layers = len(self.value_cache_config)

        self.block_size = cache_config.block_size
        self.num_device_blocks = cache_config.num_gpu_blocks
        self.num_swap_blocks = cache_config.num_cpu_blocks

        self.ov_cache_dtype = str_to_ov_type[self.cache_config.cache_dtype]

        self.kv_cache: List[Tuple[ov.Tensor,
                                  ov.Tensor]] = self._allocate_kv_cache(
                                      self.num_device_blocks, ov_core,
                                      ov_device)

        self.swap_cache: List[Tuple[ov.Tensor,
                                    ov.Tensor]] = self._allocate_swap_cache(
                                        self.num_swap_blocks, ov_device)

    def _allocate_kv_cache(
        self,
        num_blocks: int,
        ov_core: ov.Core,
        ov_device: str,
    ) -> List[Tuple[ov.Tensor, ov.Tensor]]:
        kv_cache: List[Tuple[ov.Tensor, ov.Tensor]] = []

        for key_cache_pshape, value_cache_pshape in zip(self.key_cache_config, self.value_cache_config):
            key_cache_shape = key_cache_pshape
            value_cache_shape = value_cache_pshape
            key_cache_shape[0] = num_blocks
            value_cache_shape[0] = num_blocks
            key_cache_shape = key_cache_shape.to_shape()
            value_cache_shape = value_cache_shape.to_shape()

            if current_platform.is_openvino_cpu():
                key_blocks = ov.Tensor(self.ov_cache_dtype, key_cache_shape)
                value_blocks = ov.Tensor(self.ov_cache_dtype, value_cache_shape)
                kv_cache.append((key_blocks, value_blocks))
            else:
                remote_context = ov_core.get_default_context(ov_device)
                key_blocks = remote_context.create_tensor(self.ov_cache_dtype, key_cache_shape, {})
                value_blocks = remote_context.create_tensor(self.ov_cache_dtype, value_cache_shape, {})
                kv_cache.append((key_blocks, value_blocks))

        return kv_cache

    def _allocate_swap_cache(
        self,
        num_blocks: int,
        ov_device: str,
    ) -> List[Tuple[ov.Tensor, ov.Tensor]]:
        swap_cache: List[Tuple[ov.Tensor, ov.Tensor]] = []

        if num_blocks == 0:
            return swap_cache

        assert not current_platform.is_openvino_cpu(), \
            "CPU device isn't supposed to have swap cache"

        for key_cache_pshape, value_cache_pshape in zip(self.key_cache_config, self.value_cache_config):
            key_cache_shape = key_cache_pshape
            value_cache_shape = value_cache_pshape
            key_cache_shape[0] = num_blocks
            value_cache_shape[0] = num_blocks

            key_blocks = ov.Tensor(self.ov_cache_dtype, key_cache_shape.to_shape())
            value_blocks = ov.Tensor(self.ov_cache_dtype, value_cache_shape.to_shape())
            swap_cache.append((key_blocks, value_blocks))

        return swap_cache

    def swap_in(self, src_to_dst: List[Tuple[int, int]]) -> None:
        for i in range(self.num_layers):
            for swap_tensor, kv_tensor in zip(self.swap_cache[i],
                                              self.kv_cache[i]):
                swap_blocks(swap_tensor, kv_tensor, src_to_dst)

    def swap_out(self, src_to_dst: List[Tuple[int, int]]) -> None:
        for i in range(self.num_layers):
            for swap_tensor, kv_tensor in zip(self.swap_cache[i],
                                              self.kv_cache[i]):
                swap_blocks(kv_tensor, swap_tensor, src_to_dst)

    def copy(self, src_to_dsts: List[Tuple[int, int]]) -> None:
        if (len(src_to_dsts) > 0):
            copy_blocks(self.kv_cache, src_to_dsts)

    @staticmethod
    def get_cache_block_size(
        cache_dtype: str,
        key_cache_config: List[ov.PartialShape],
        value_cache_config: List[ov.PartialShape],
    ) -> int:
        total_elements = 0
        for key_cache_shape, value_cache_shape in zip(key_cache_config, value_cache_config):
             total_elements += key_cache_shape[1].get_length() * key_cache_shape[2].get_length() * key_cache_shape[3].get_length()
             total_elements += value_cache_shape[1].get_length() * value_cache_shape[2].get_length() * value_cache_shape[3].get_length()
        return str_to_ov_type[cache_dtype].size * total_elements
