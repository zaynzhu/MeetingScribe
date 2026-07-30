"""
ASR 转录模块

基于 faster-whisper 做本地转录，音频数据不出本机。
首次使用会从 HuggingFace 下载模型（small 约 240MB，仅一次）。

通过环境变量配置，无需改代码：
    ASR_ENGINE       whisper（默认，真实本地转录）| mock（假数据，用于无模型环境/测试）
    ASR_MODEL        faster-whisper 模型大小：tiny/base/small/medium/large-v3（默认 small）
    ASR_LANGUAGE     转录语言：zh / en / auto（默认 zh）
    ASR_DEVICE       cpu（默认）| cuda
    ASR_COMPUTE_TYPE int8（CPU 默认，最快）| int8_float16 | float16（GPU）

输出格式与历史 Mock 一致：[HH:MM:SS - HH:MM:SS] 文本，便于前端和 LLM 提取复用。
"""

import os
import time
import random

ASR_ENGINE = os.getenv('ASR_ENGINE', 'whisper').lower()
WHISPER_MODEL = os.getenv('ASR_MODEL', 'small')
WHISPER_LANGUAGE = os.getenv('ASR_LANGUAGE', 'zh')
WHISPER_DEVICE = os.getenv('ASR_DEVICE', 'cpu')
WHISPER_COMPUTE_TYPE = os.getenv('ASR_COMPUTE_TYPE', 'int8')

# 惰性加载的模型实例，避免启动时下载和占用内存
_model = None


def _get_model():
    """惰性加载 faster-whisper 模型，首次调用才下载。"""
    global _model
    if _model is None:
        from faster_whisper import WhisperModel
        _model = WhisperModel(
            WHISPER_MODEL,
            device=WHISPER_DEVICE,
            compute_type=WHISPER_COMPUTE_TYPE,
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
    # language=None 时让模型自动检测；vad_filter 过滤静音段，提速并提升质量
    language = WHISPER_LANGUAGE if WHISPER_LANGUAGE and WHISPER_LANGUAGE != 'auto' else None
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

    默认走 faster-whisper 本地转录；设置 ASR_ENGINE=mock 可回退到假数据。
    """
    if ASR_ENGINE == 'mock':
        return _transcribe_mock()
    return _transcribe_whisper(audio_path)