# SPDX-License-Identifier: Apache-2.0

# ruff: noqa: SIM117
from copy import deepcopy
from pathlib import Path
from typing import Optional

import openvino as ov
import torch
from huggingface_hub import HfApi
from openvino._offline_transformations import paged_attention_transformation
from optimum.intel import OVModelForCausalLM
from optimum.intel.utils.import_utils import is_openvino_version
from torch import nn
from vllm.config import ModelConfig, VllmConfig, set_current_vllm_config
from vllm.forward_context import get_forward_context
from vllm.logger import init_logger
from vllm.model_executor.layers.logits_processor import LogitsProcessor
from vllm.v1.sample.sampler import Sampler

import vllm_openvino.envs as envs

logger = init_logger(__name__)


def _flatten_inputs(inputs):
    flatten_inputs = []
    for input_data in inputs:
        if input_data is None:
            continue
        if isinstance(input_data, (list, tuple)):
            flatten_inputs.extend(_flatten_inputs(input_data))
        elif isinstance(input_data, dict):
            flatten_inputs.extend(_flatten_inputs(list(input_data.values())))
        else:
            flatten_inputs.append(input_data)
    return flatten_inputs


def _modify_cache_parameters(model: ov.Model, kv_cache_dtype: ov.Type):
    if kv_cache_dtype != "dynamic":
        model.set_rt_info(kv_cache_dtype, ["runtime_options", "KV_CACHE_PRECISION"])

    for parameter in model.get_parameters():
        input = parameter.get_output_tensor(0)
        input_names = input.get_names()
        if len(input_names) != 1:
            continue
        input_name = next(iter(input_names))
        is_key_cache = input_name.startswith("key_cache.")
        is_value_cache = input_name.startswith("value_cache.")

        if is_key_cache or is_value_cache:
            shape = parameter.get_partial_shape()
            num_heads = shape[1].get_length()
            head_size = shape[2].get_length()
            parameter.set_partial_shape(ov.PartialShape.dynamic(4))
            parameter.set_element_type(ov.Type.undefined)
            pa_op = next(iter(parameter.output(0).get_target_inputs())).get_node()
            pa_op.get_rt_info()["num_k_heads" if is_key_cache else "num_v_heads"] = num_heads
            pa_op.get_rt_info()["k_head_size" if is_key_cache else "v_head_size"] = head_size


def _require_model_export(model_id, revision=None, subfolder=None):
    model_dir = Path(model_id)
    if subfolder is not None:
        model_dir = model_dir / subfolder
    if model_dir.is_dir():
        return (not (model_dir / "openvino_model.xml").exists()
                or not (model_dir / "openvino_model.bin").exists())

    hf_api = HfApi()
    try:
        model_info = hf_api.model_info(model_id, revision=revision or "main")
        normalized_subfolder = (None if subfolder is None else
                                Path(subfolder).as_posix())
        model_files = [
            file.rfilename for file in model_info.siblings
            if normalized_subfolder is None
            or file.rfilename.startswith(normalized_subfolder)
        ]
        ov_model_path = ("openvino_model.xml" if normalized_subfolder is None
                         else f"{normalized_subfolder}/openvino_model.xml")
        return (ov_model_path not in model_files
                or ov_model_path.replace(".xml", ".bin") not in model_files)
    except Exception:
        return True


def has_op_with_type(function: ov.Model, type_name: str):
    for op in function.get_ops():
        if op.get_type_name() == type_name:
            return True
    return False


def find_llm_matmul(model: ov.Model):
    last_node = model.output(0).get_node().input_value(0).get_node()

    pa_based_model = has_op_with_type(model, "PagedAttentionExtension")
    slice_gather_dim = 0 if pa_based_model else 1
    last_node_type = last_node.get_type_name()
    matmul = last_node
    if last_node_type == "MatMul":
        return matmul, slice_gather_dim
    elif last_node_type == "Add":
        matmul = last_node.input_value(0).node
    elif last_node_type == "Transpose":
        matmul = last_node.input_value(0).node
        order = last_node.input_value(1).node.data
        slice_gather_dim = order[slice_gather_dim]
    elif last_node_type == "Multiply":
        multiply = last_node
        tanh = multiply.input_value(0).node
        if tanh.get_type_name() == "Tanh":
            divide = tanh.input_value(0).node
            if divide.get_type_name() == "Divide":
                matmul = divide.input_value(0).node
    assert matmul.get_type_name() == "MatMul", "Could not find MatMul in the model output."
    return matmul, slice_gather_dim


def apply_gather_before_matmul_transformation(model: ov.Model):
    matmul, slice_gather_dim = find_llm_matmul(model)
    if matmul.get_type_name() == "MatMul" and matmul.input(0).get_partial_shape().rank == 3:
        indices = ov.op.Parameter(ov.Type.i64, ov.PartialShape([-1]))
        indices.set_friendly_name("sampled_tokens_indices")
        indices.output(0).get_tensor().set_names({"sampled_tokens_indices"})
        axis = ov.op.Constant(ov.Type.i64, ov.Shape([1]), [slice_gather_dim])
        gather = ov.opset8.gather(matmul.input_value(0), indices, axis)
        matmul.input(0).replace_source_output(gather.output(0))
        model.add_parameters([indices])


class OpenVINOCausalLM(nn.Module):

    def __init__(
        self,
        ov_core: ov.Core,
        model_config: ModelConfig,
        kv_cache_dtype: ov.Type,
    ) -> None:
        super().__init__()
        self.logits_processor = LogitsProcessor(
            model_config.hf_text_config.vocab_size, logits_as_input=True)
        self.sampler = Sampler()

        export = _require_model_export(model_config.model)
        if export:
            logger.warning(
                f"Provided model id {model_config.model} does not "
                "contain OpenVINO IR, the model will be converted to IR with "
                "default options. If you need to use specific options for "
                "model conversion, use optimum-cli export openvino with "
                "desired options.")
        else:
            logger.warning(
                "OpenVINO IR is available for provided model id "
                f"{model_config.model}. This IR will be used for inference "
                "as-is, all possible options that may affect model conversion "
                "are ignored.")

        hf_config = getattr(model_config, 'hf_config', None)
        is_gemma4 = (
            hf_config is not None
            and hasattr(hf_config, 'model_type')
            and hf_config.model_type == "gemma4"
        )

        if is_gemma4:
            # Gemma4 has model_type "gemma4" (multimodal) but optimum's
            # OVModelForCausalLM only supports text-generation-with-past,
            # not image-text-to-text. Override to "gemma4_text" so optimum
            # uses the text-only export path, producing a single ov.Model
            # (embedding + LM) compatible with our transformations.
            gemma4_config = deepcopy(hf_config)
            gemma4_config.model_type = "gemma4_text"
            load_in_8bit = envs.VLLM_OPENVINO_ENABLE_QUANTIZED_WEIGHTS
            pt_model = OVModelForCausalLM.from_pretrained(
                model_config.model,
                export=True,
                compile=False,
                config=gemma4_config,
                load_in_8bit=load_in_8bit,
                trust_remote_code=model_config.trust_remote_code,
            )
        else:
            pt_model = None
            for export_try in (False, True):
                if pt_model is not None:
                    break
                load_in_8bit = (envs.VLLM_OPENVINO_ENABLE_QUANTIZED_WEIGHTS
                                if export_try else False)
                try:
                    pt_model = OVModelForCausalLM.from_pretrained(
                        model_config.model,
                        export=export_try,
                        compile=False,
                        load_in_8bit=load_in_8bit,
                        trust_remote_code=model_config.trust_remote_code,
                    )
                except Exception:
                    if export_try:
                        raise
                    logger.info(
                        "No existing OpenVINO IR found, will attempt export...")
            assert pt_model is not None

        paged_attention_transformation(pt_model.model)
        apply_gather_before_matmul_transformation(pt_model.model)
        if is_openvino_version("<", "2026.0.0"):
            _modify_cache_parameters(pt_model.model, kv_cache_dtype)
        pt_model.model.validate_nodes_and_infer_types()

        ov_device = envs.VLLM_OPENVINO_DEVICE
        ov_compiled = ov_core.compile_model(pt_model.model, ov_device)
        self.ov_request = ov_compiled.create_infer_request()

    def forward(
        self,
        input_ids: torch.Tensor,
        positions: torch.Tensor,
        kv_caches: list[tuple[ov.Tensor, ov.Tensor]],
    ) -> torch.Tensor:
        flat_kv_caches = _flatten_inputs(kv_caches)
        attn_metadata = get_forward_context().attn_metadata

        inputs = [
            input_ids,
            positions,
            *flat_kv_caches,
            attn_metadata.past_lens,
            attn_metadata.subsequence_begins,
            attn_metadata.block_indices,
            attn_metadata.block_indices_begins,
            attn_metadata.max_context_len,
            attn_metadata.sampled_token_indices,
        ]

        self.ov_request.start_async(inputs, share_inputs=True)
        self.ov_request.wait()

        logits = torch.from_numpy(self.ov_request.get_tensor("logits").data)

        return logits.view(-1, logits.shape[-1])

    def compute_logits(self, hidden_states: torch.Tensor,
                       sampling_metadata) -> torch.Tensor:
        logits = self.logits_processor(None, hidden_states, sampling_metadata)
        return logits

    def sample(
        self,
        logits: torch.Tensor,
        sampling_metadata,
    ) -> Optional["SamplerOutput"]:
        next_tokens = self.sampler(logits, sampling_metadata)
        return next_tokens


def get_model(
    vllm_config: VllmConfig,
    kv_cache_dtype: ov.Type,
    **kwargs,
) -> torch.nn.Module:
    lora_config = kwargs.get("lora_config")
    ov_core = kwargs.get("ov_core")
    if lora_config:
        raise ValueError(
            "OpenVINO modeling does not support LoRA, "
            "but LoRA is enabled. Support for this model may "
            "be added in the future. If this is important to you, "
            "please open an issue on github.")

    with set_current_vllm_config(vllm_config):
        return OpenVINOCausalLM(ov_core, vllm_config.model_config,
                                kv_cache_dtype)
