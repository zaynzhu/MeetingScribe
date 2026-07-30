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

app = FastAPI(title='MeetingScribe API')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_methods=['*'],
    allow_headers=['*'],
)

# 初始化数据库
db.init_db()


# --- 请求/响应模型 ---

class LLMConfig(BaseModel):
    provider: str | None = None
    base_url: str | None = None
    api_key: str | None = None
    model: str | None = None


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


@app.post('/api/config/llm')
async def set_llm_config(config: LLMConfig):
    """设置 LLM API 配置"""
    llm.set_config(
        provider=config.provider,
        base_url=config.base_url,
        api_key=config.api_key,
        model=config.model,
    )
    return {'ok': True, 'config': llm.get_config()}


@app.get('/api/config/llm')
async def get_llm_config():
    """获取当前 LLM 配置"""
    config = llm.get_config()
    # 隐藏 api_key
    if config.get('api_key'):
        config['api_key'] = config['api_key'][:8] + '***'
    return config


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
