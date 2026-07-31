"""
LLM 结构化提取模块

支持两种协议，由 provider 配置项切换：
- openai（默认）：OpenAI 兼容 API，支持百炼/Qwen/GLM/DeepSeek/OpenAI 等任意兼容服务
- anthropic：Anthropic Claude API

通过 set_config 更新配置，前端设置面板写入。配置仅存内存，重启后端会重置。
"""

import json
import re
import time
from openai import OpenAI

# 全局配置，通过 set_config 更新
_config = {
    'provider': 'openai',
    'base_url': 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    'api_key': '',
    'model': 'qwen-plus',
}

_client = None
_client_provider = None


def set_config(provider: str = None, base_url: str = None, api_key: str = None, model: str = None):
    global _client
    if provider is not None:
        _config['provider'] = provider
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
    """按当前 provider 构建对应客户端，provider 切换时重建。"""
    global _client, _client_provider
    provider = _config['provider']
    if _client is None or _client_provider != provider:
        if provider == 'anthropic':
            from anthropic import Anthropic
            _client = Anthropic(
                base_url=_config['base_url'],
                api_key=_config['api_key'],
            )
        else:
            _client = OpenAI(
                base_url=_config['base_url'],
                api_key=_config['api_key'],
            )
        _client_provider = provider
    return _client


SYSTEM_PROMPT = """你是一个专业的会议纪要助手。请从会议文字稿中提取以下结构化信息。

请严格以 JSON 格式返回，不要包含其他文字，不要用 markdown 代码块包裹。JSON 结构如下：

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


def _parse_json(content: str) -> dict:
    """从模型响应中提取 JSON，兼容 markdown 代码块包裹和前后多余文字。"""
    content = (content or '').strip()
    # 优先匹配 ```json ... ``` 或 ``` ... ``` 包裹
    m = re.search(r'```(?:json)?\s*(\{.*\})\s*```', content, re.DOTALL)
    if m:
        return json.loads(m.group(1))
    # 否则取第一个 { 到最后一个 } 之间的内容
    m = re.search(r'\{.*\}', content, re.DOTALL)
    if m:
        return json.loads(m.group(0))
    # 兜底直接解析
    return json.loads(content)


def _extract_openai(transcript: str) -> dict:
    """OpenAI 兼容协议：用 response_format 强制 JSON 返回。"""
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
    return _parse_json(response.choices[0].message.content)


def _extract_anthropic(transcript: str) -> dict:
    """Anthropic 协议：Claude messages API，无强制 JSON 模式，靠 prompt + 容错解析。"""
    client = _get_client()
    response = client.messages.create(
        model=_config['model'],
        max_tokens=4096,
        system=SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': f'以下是会议文字稿，请提取结构化纪要：\n\n{transcript}'}],
        temperature=0.3,
    )
    return _parse_json(response.content[0].text)


def extract_minutes(transcript: str) -> dict:
    """根据当前 provider 调用对应 LLM 提取结构化会议纪要。"""
    if _config['provider'] == 'anthropic':
        return _extract_anthropic(transcript)
    return _extract_openai(transcript)


def test_connection() -> dict:
    """用当前 client 发极短请求测试连通性，返回 {ok, latency_ms, error}。"""
    start = time.time()
    try:
        client = _get_client()
        if _config['provider'] == 'anthropic':
            client.messages.create(
                model=_config['model'],
                max_tokens=1,
                messages=[{'role': 'user', 'content': 'ping'}],
            )
        else:
            client.chat.completions.create(
                model=_config['model'],
                messages=[{'role': 'user', 'content': 'ping'}],
                max_tokens=1,
            )
        return {'ok': True, 'latency_ms': int((time.time() - start) * 1000), 'error': ''}
    except Exception as e:
        return {'ok': False, 'latency_ms': int((time.time() - start) * 1000), 'error': str(e)}