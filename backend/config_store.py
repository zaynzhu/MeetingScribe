"""
配置持久化与来源诊断

把 LLM 和 ASR 配置统一落到 data/config.json（人类可读、换电脑可拷）。
优先级：环境变量 > config.json > 代码默认值。部署用 env 覆盖，用户在 UI 改的写文件。

启动时由 main.py 调 apply_to_modules() 把有效值灌进 llm._config 和 asr._config，
避免 asr.py 自己再读一次 env 造成两处不一致。
"""

import os
import json
import copy
import tempfile

# 数据目录：优先读环境变量（便于打包后指向 userData），否则用项目内 data/
_DATA_DIR = os.getenv('MEETINGSCRIBE_DATA_DIR', os.path.join(os.path.dirname(__file__), '..', 'data'))
CONFIG_PATH = os.path.join(_DATA_DIR, 'config.json')

DEFAULT_CONFIG = {
    'llm': {
        'provider': 'openai',
        'base_url': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        'api_key': '',
        'model': 'qwen-plus',
    },
    'asr': {
        'engine': 'whisper',
        'model': 'small',
        'language': 'zh',
        'device': 'cpu',
        'compute_type': 'int8',
    },
}

# 只有 ASR 支持环境变量覆盖（历史上是 env 驱动）；LLM 不暴露 env，避免扩大范围
ENV_MAP = {
    'asr.engine': 'ASR_ENGINE',
    'asr.model': 'ASR_MODEL',
    'asr.language': 'ASR_LANGUAGE',
    'asr.device': 'ASR_DEVICE',
    'asr.compute_type': 'ASR_COMPUTE_TYPE',
}

# 各 section 的键顺序
SECTION_KEYS = {
    'llm': ['provider', 'base_url', 'api_key', 'model'],
    'asr': ['engine', 'model', 'language', 'device', 'compute_type'],
}


def load_config() -> dict:
    """读取文件原始配置，文件不存在/损坏返回 {}。不补全默认，便于 get_effective_config 区分来源。"""
    if not os.path.exists(CONFIG_PATH):
        return {}
    try:
        with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        # 文件损坏则当作空，不抛错（配置坏了不该挡启动）
        return {}


def save_config(patch: dict):
    """合并 patch 到文件并原子写入。patch 形如 {'llm': {...}, 'asr': {...}}，只写非 None 项。"""
    os.makedirs(_DATA_DIR, exist_ok=True)
    file_cfg = load_config()
    # 以默认值为底，叠上文件已有值，再叠 patch，得到完整配置
    cfg = copy.deepcopy(DEFAULT_CONFIG)
    for section, keys in SECTION_KEYS.items():
        for key in keys:
            if section in file_cfg and key in file_cfg[section]:
                cfg[section][key] = file_cfg[section][key]
    for section, keys in SECTION_KEYS.items():
        if section not in patch:
            continue
        for key in keys:
            if key in patch[section] and patch[section][key] is not None:
                cfg[section][key] = patch[section][key]
    # 原子写：先写临时文件再替换，避免崩溃写坏配置
    fd, tmp_path = tempfile.mkstemp(dir=_DATA_DIR, suffix='.tmp')
    try:
        with os.fdopen(fd, 'w', encoding='utf-8') as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, CONFIG_PATH)
    except Exception:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
        raise


def get_effective_config() -> tuple:
    """返回 (values, sources)。逐项 env > file > default。sources 值为 'env'/'file'/'default'。"""
    file_cfg = load_config()
    values = {}
    sources = {}
    for section, keys in SECTION_KEYS.items():
        values[section] = {}
        for key in keys:
            flat = f'{section}.{key}'
            env_name = ENV_MAP.get(flat)
            env_val = os.getenv(env_name) if env_name else None
            if env_val is not None:
                values[section][key] = env_val
                sources[flat] = 'env'
            elif section in file_cfg and key in file_cfg[section]:
                values[section][key] = file_cfg[section][key]
                sources[flat] = 'file'
            else:
                values[section][key] = DEFAULT_CONFIG[section][key]
                sources[flat] = 'default'
    return values, sources


def apply_to_modules():
    """启动时把有效值灌进 llm._config 和 asr._config，统一配置来源。"""
    values, _ = get_effective_config()
    # 延迟 import 避免循环依赖
    import llm
    import asr
    for key in SECTION_KEYS['llm']:
        llm._config[key] = values['llm'][key]
    llm._client = None  # 配置变了，客户端重建
    for key in SECTION_KEYS['asr']:
        asr._config[key] = values['asr'][key]
    asr._model = None  # 启动时清模型，下次转录按新配置加载