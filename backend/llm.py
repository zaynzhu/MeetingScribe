"""
LLM 结构化提取模块

使用 OpenAI 兼容 API，支持任意兼容服务（Qwen、GLM、DeepSeek 等）。
"""

import json
from openai import OpenAI

# 全局配置，通过 set_config 更新
_config = {
    'base_url': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    'api_key': '',
    'model': 'qwen-plus',
}

_client = None


def set_config(base_url: str = None, api_key: str = None, model: str = None):
    global _client
    if base_url is not None:
        _config['base_url'] = base_url
    if api_key is not None:
        _config['api_key'] = api_key
    if model is not None:
        _config['model'] = model
    _client = None  # 重置客户端以使用新配置


def get_config():
    return {**_config}


def _get_client():
    global _client
    if _client is None:
        _client = OpenAI(
            base_url=_config['base_url'],
            api_key=_config['api_key'],
        )
    return _client


SYSTEM_PROMPT = """你是一个专业的会议纪要助手。请从会议文字稿中提取以下结构化信息。

请严格以 JSON 格式返回，不要包含其他文字。JSON 结构如下：

{
  "summary": "会议摘要，3-5句话概括会议主要内容和结论",
  "decisions": [
    "决策1：...",
    "决策2：..."
  ],
  "actions": [
    {
      "task": "具体任务描述",
      "owner": "负责人姓名",
      "deadline": "截止日期或时间范围"
    }
  ],
  "timeline": [
    {
      "time_range": "00:00 - 02:30",
      "topic": "话题标题",
      "summary": "该话题的简要总结"
    }
  ]
}

注意：
- summary 应简洁有力，抓住核心
- decisions 是会议中达成的明确决定
- actions 必须包含负责人和截止日期，如果文字稿中未明确提及则标注"待定"
- timeline 按话题分段，每段标注时间范围"""


def extract_minutes(transcript: str) -> dict:
    """
    调用 LLM 从文字稿中提取结构化会议纪要。
    """
    client = _get_client()

    response = client.chat.completions.create(
        model=_config['model'],
        messages=[
            {'role': 'system', 'content': SYSTEM_PROMPT},
            {'role': 'user', 'content': f'以下是会议文字稿，请提取结构化纪要：\n\n{transcript}'},
        ],
        temperature=0.3,
        response_format={'type': 'json_object'},
    )

    content = response.choices[0].message.content
    return json.loads(content)
