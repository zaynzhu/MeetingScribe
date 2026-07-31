"""
ASR 转录模块

基于 faster-whisper 做本地转录，音频数据不出本机。
首次使用会从 HuggingFace 下载模型（small 约 240MB，仅一次）。

配置由 config_store 统一供给（env > config.json > 默认值），启动时灌入 _config。
运行时通过 set_asr_config 修改，仅当 engine/model/device/compute_type 变化时才重载模型；
只改 language 不触发重载（它只是转录时的传参）。

输出格式：[HH:MM:SS - HH:MM:SS] 文本，便于前端和 LLM 提取复用。
"""

import time
import random

# 运行时配置，启动时由 config_store.apply_to_modules 灌入
_config = {
    'engine': 'whisper',
    'model': 'small',
    'language': 'zh',
    'device': 'cpu',
    'compute_type': 'int8',
}

# 惰性加载的模型实例，避免启动时下载和占用内存
_model = None

# 这些字段变化需要重新加载模型；language 不在此列（只影响 transcribe 传参）
_RELOAD_KEYS = ('engine', 'model', 'device', 'compute_type')


def set_asr_config(engine=None, model=None, language=None, device=None, compute_type=None):
    """更新 ASR 配置。仅当 engine/model/device/compute_type 任一变化时才重置模型。"""
    global _model
    changed = False
    for key, val in [('engine', engine), ('model', model),
                     ('device', device), ('compute_type', compute_type)]:
        if val is not None and val != _config[key]:
            _config[key] = val
            changed = True
    if language is not None:
        _config['language'] = language  # 单独改不重载
    if changed:
        _model = None  # 下次 _get_model 按新配置重建


def get_asr_config():
    return {**_config}


def _get_model():
    """惰性加载 faster-whisper 模型，首次调用才下载。"""
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel(
            _config['model'],
            device=_config['device'],
            compute_type=_config['compute_type'],
        )
    return _model


def _format_timestamp(seconds: float) -> str:
    """秒数转 HH:MM:SS"""
    total = int(seconds)
    h = total // 3600
    m = (total % 3600) // 60
    s = total % 60
    return f'{h:02d}:{m:02d}:{s:02d}'


def _transcribe_whisper(audio_path: str) -> str:
    """用 faster-whisper 转录，输出 [时间] 文本 分段格式。"""
    model = _get_model()
    # language=None 或 auto 时让模型自动检测；vad_filter 过滤静音段，提速并提升质量
    language = _config['language'] if _config['language'] and _config['language'] != 'auto' else None
    segments, _info = model.transcribe(
        audio_path,
        language=language,
        vad_filter=True,
    )

    lines = []
    for seg in segments:
        text = seg.text.strip()
        if text:
            lines.append(f'[{_format_timestamp(seg.start)} - {_format_timestamp(seg.end)}] {text}')

    if not lines:
        return '[转录结果为空，可能是音频无语音或格式不支持]'
    return '\n\n'.join(lines)


# --- Mock 回退（无模型环境/测试用）---

MOCK_TRANSCRIPTS = [
    {
        'text': '''[00:00:00 - 00:00:15] 主持人：大家好，今天我们讨论Q3的产品规划。请各位先汇报一下各自负责模块的进展。

[00:00:15 - 00:01:30] 张明：好的。用户反馈系统已经完成了80%，预计下周可以进入测试阶段。主要的改动包括：新的评分界面、批量导出功能、以及实时通知模块。

[00:01:30 - 00:02:45] 李华：数据分析平台这边，我们已经完成了数据清洗管道的重构。性能提升了大约3倍。下一步是接入新的数据源。

[00:02:45 - 00:04:00] 主持人：很好。关于数据源接入，我们需要讨论一下优先级。客户A要求在月底前完成对接。

[00:04:00 - 00:05:30] 李华：时间比较紧，但如果把API文档先定下来，开发这边可以在两周内完成。需要产品这边确认接口规范。

[00:05:30 - 00:07:00] 王芳：产品侧我已经整理好了需求文档，今天下午发给大家 review。接口规范这周五之前可以定稿。

[00:07:00 - 00:08:30] 主持人：好的，那我们定几个关键节点：周五接口规范定稿，两周后开发完成对接，月底前完成联调测试。大家有没有问题？

[00:08:30 - 00:09:00] 张明/李华：没问题。

[00:09:00 - 00:10:00] 主持人：好，今天的会议就到这里。行动项我稍后发到群里。谢谢大家。''',
    },
]


def _transcribe_mock() -> str:
    # 模拟转录耗时
    time.sleep(random.uniform(1.5, 3.0))
    return random.choice(MOCK_TRANSCRIPTS)['text']


def transcribe_file(audio_path: str) -> str:
    """
    转录音频文件为带时间戳的文字稿。

    默认走 faster-whisper 本地转录；engine=mock 回退到假数据。
    """
    if _config['engine'] == 'mock':
        return _transcribe_mock()
    return _transcribe_whisper(audio_path)