"""
MeetingScribe Python 后端
FastAPI 服务，提供转录、LLM 提取、历史记录、导出等 API。
"""

import os
import json
import asyncio
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

import db
import asr
import llm
import config_store

app = FastAPI(title='MeetingScribe API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# 初始化数据库，并把配置文件/env 的有效值灌进 llm/asr 模块
db.init_db()
config_store.apply_to_modules()


# --- 请求/响应模型 ---

class LLMConfig(BaseModel):
    provider: str | None = None
    base_url: str | None = None
    api_key: str | None = None
    model: str | None = None


class ASRConfig(BaseModel):
    engine: str | None = None
    model: str | None = None
    language: str | None = None
    device: str | None = None
    compute_type: str | None = None


class TranscribePathRequest(BaseModel):
    path: str


class MeetingCreate(BaseModel):
    filename: str
    transcript: str
    summary: str = ''
    decisions: str = ''
    actions: str = ''
    timeline: str = ''


class MeetingUpdate(BaseModel):
    summary: str | None = None
    decisions: str | None = None
    actions: str | None = None
    timeline: str | None = None


# --- API 端点 ---

@app.post('/api/transcribe')
async def transcribe_audio(file: UploadFile = File(...)):
    """上传音频文件并转录"""
    # 保存上传文件到临时目录
    upload_dir = os.path.join(os.path.dirname(__file__), '..', 'data', 'uploads')
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, file.filename)

    with open(file_path, 'wb') as f:
        content = await file.read()
        f.write(content)

    # 调用 ASR 转录（CPU 密集长任务，丢到线程池避免阻塞事件循环）
    try:
        transcript = await asyncio.to_thread(asr.transcribe_file, file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'转录失败: {str(e)}')

    # 保存到数据库
    meeting_id = db.save_meeting(file.filename, transcript)

    return {
        'meeting_id': meeting_id,
        'filename': file.filename,
        'transcript': transcript,
    }


@app.post('/api/transcribe/path')
async def transcribe_path(req: TranscribePathRequest):
    """Electron 桌面模式：直接转录本地文件路径，免上传"""
    if not os.path.exists(req.path):
        raise HTTPException(status_code=404, detail='文件不存在')
    try:
        transcript = await asyncio.to_thread(asr.transcribe_file, req.path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'转录失败: {str(e)}')
    filename = os.path.basename(req.path)
    meeting_id = db.save_meeting(filename, transcript)
    return {
        'meeting_id': meeting_id,
        'filename': filename,
        'transcript': transcript,
    }


@app.post('/api/summarize/{meeting_id}')
async def summarize_meeting(meeting_id: int):
    """调用 LLM 提取结构化纪要"""
    meeting = db.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail='会议记录不存在')

    try:
        result = llm.extract_minutes(meeting['transcript'])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'LLM 提取失败: {str(e)}')

    # 更新数据库
    db.update_meeting(
        meeting_id,
        summary=result.get('summary', ''),
        decisions=json.dumps(result.get('decisions', []), ensure_ascii=False),
        actions=json.dumps(result.get('actions', []), ensure_ascii=False),
        timeline=json.dumps(result.get('timeline', []), ensure_ascii=False),
    )

    return result


@app.get('/api/meetings')
async def list_meetings():
    """获取所有会议记录"""
    return db.get_meetings()


@app.get('/api/meetings/{meeting_id}')
async def get_meeting(meeting_id: int):
    """获取单条会议记录"""
    meeting = db.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail='会议记录不存在')
    return meeting


@app.delete('/api/meetings/{meeting_id}')
async def delete_meeting(meeting_id: int):
    """删除会议记录"""
    db.delete_meeting(meeting_id)
    return {'ok': True}


def _masked_values(values: dict) -> dict:
    """脱敏后的有效配置（api_key 只保留前 8 位），供前端展示。"""
    out = json.loads(json.dumps(values))  # 深拷贝
    if out.get('llm', {}).get('api_key'):
        out['llm']['api_key'] = out['llm']['api_key'][:8] + '***'
    return out


@app.get('/api/config')
async def get_config():
    """获取全部 LLM+ASR 有效配置及每项来源（env/file/default），api_key 脱敏"""
    values, sources = config_store.get_effective_config()
    return {'values': _masked_values(values), 'sources': sources}


@app.post('/api/config/llm')
async def set_llm_config(config: LLMConfig):
    """设置 LLM 配置：更新内存并持久化到 config.json，返回新有效值+来源"""
    llm.set_config(
        provider=config.provider,
        base_url=config.base_url,
        api_key=config.api_key,
        model=config.model,
    )
    config_store.save_config({'llm': llm.get_config()})
    values, sources = config_store.get_effective_config()
    return {'ok': True, 'values': _masked_values(values), 'sources': sources}


@app.get('/api/config/llm')
async def get_llm_config():
    """获取当前 LLM 配置（兼容旧前端，内部走统一配置来源）"""
    values, _ = config_store.get_effective_config()
    cfg = values['llm']
    if cfg.get('api_key'):
        cfg = {**cfg, 'api_key': cfg['api_key'][:8] + '***'}
    return cfg


@app.post('/api/config/asr')
async def set_asr_config(config: ASRConfig):
    """设置 ASR 配置：更新内存并持久化，返回新有效值+来源"""
    asr.set_asr_config(
        engine=config.engine,
        model=config.model,
        language=config.language,
        device=config.device,
        compute_type=config.compute_type,
    )
    config_store.save_config({'asr': asr.get_asr_config()})
    values, sources = config_store.get_effective_config()
    return {'ok': True, 'values': _masked_values(values), 'sources': sources}


@app.post('/api/config/llm/test')
async def test_llm_connection():
    """测试当前 LLM 配置连通性"""
    return llm.test_connection()


@app.get('/api/export/{meeting_id}')
async def export_meeting(meeting_id: int):
    """导出会议纪要为 Markdown"""
    meeting = db.get_meeting(meeting_id)
    if not meeting:
        raise HTTPException(status_code=404, detail='会议记录不存在')

    md = _generate_markdown(meeting)
    return {'markdown': md, 'filename': f"{meeting['filename']}_纪要.md"}


def _generate_markdown(meeting: dict) -> str:
    """从会议记录生成 Markdown"""
    lines = [f"# 会议纪要：{meeting['filename']}\n"]
    lines.append(f"**生成时间**：{meeting['created_at'][:19]}\n")

    if meeting.get('summary'):
        lines.append('## 会议摘要\n')
        lines.append(f"{meeting['summary']}\n")

    if meeting.get('decisions'):
        decisions = json.loads(meeting['decisions']) if isinstance(meeting['decisions'], str) else meeting['decisions']
        if decisions:
            lines.append('## 关键决策\n')
            for d in decisions:
                lines.append(f"- {d}")
            lines.append('')

    if meeting.get('actions'):
        actions = json.loads(meeting['actions']) if isinstance(meeting['actions'], str) else meeting['actions']
        if actions:
            lines.append('## 行动项\n')
            lines.append('| 任务 | 负责人 | 截止日期 |')
            lines.append('|------|--------|----------|')
            for a in actions:
                lines.append(f"| {a.get('task', '')} | {a.get('owner', '待定')} | {a.get('deadline', '待定')} |")
            lines.append('')

    if meeting.get('timeline'):
        timeline = json.loads(meeting['timeline']) if isinstance(meeting['timeline'], str) else meeting['timeline']
        if timeline:
            lines.append('## 会议时间线\n')
            for t in timeline:
                lines.append(f"### {t.get('time_range', '')} - {t.get('topic', '')}\n")
                lines.append(f"{t.get('summary', '')}\n")

    if meeting.get('transcript'):
        lines.append('## 原始文字稿\n')
        lines.append('```')
        lines.append(meeting['transcript'])
        lines.append('```')

    return '\n'.join(lines)


if __name__ == '__main__':
    uvicorn.run(app, host='127.0.0.1', port=8765)
