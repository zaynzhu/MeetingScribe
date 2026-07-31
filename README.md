<div align="center">

# 🎙️ MeetingScribe

会议录音转结构化纪要 — 本地 ASR + LLM，数据不出本机

[中文](README.md) | [English](README_EN.md)

</div>

---

<div align="center">

![Electron](https://img.shields.io/badge/Electron-36-47848F?style=for-the-badge&logo=electron&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.116-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)

</div>

---

> [!TIP]
> MeetingScribe 是一款隐私优先的桌面应用，将会议录音自动转化为结构化纪要。
> 全程本地处理，ASR 转录在本机完成，仅 LLM 提取环节调用外部 API（可配置私有部署）。
> 支持拖拽上传、一键提取摘要/决策/行动项/时间线，并导出为 Markdown 文件。

## ✨ Features

- **拖拽上传** -- 直接拖入 mp3/wav/m4a 音频文件，零学习成本
- **本地 ASR 转录** -- 基于 faster-whisper 本地运行，音频数据不上传云端
- **LLM 结构化提取** -- 支持 OpenAI 兼容 / Anthropic 双协议，自动提取会议摘要、关键决策、行动项、时间线
- **行动项追踪** -- 自动识别负责人和截止日期，一目了然
- **时间线回溯** -- 按话题分段并标注时间范围，结构化呈现会议脉络
- **历史记录** -- SQLite 本地存储，随时查阅过往会议
- **Markdown 导出** -- 一键导出格式化纪要，方便分享和归档
- **API 可配置** -- 支持任意 OpenAI 兼容服务（Qwen、GLM、DeepSeek 等）

## 🚀 Quick Start

```bash
# 克隆项目
git clone <repo-url>
cd MeetingScribe

# 安装前端依赖
npm install

# 安装后端依赖
pip install -r backend/requirements.txt

# 启动后端
python backend/main.py

# 启动前端（新终端）
npm run dev:frontend
```

打开浏览器访问 `http://localhost:5173`，拖入音频文件即可开始。

## 📦 Installation

### 前置条件

- Node.js >= 18
- Python >= 3.10
- npm 或 pnpm

### 前端依赖

```bash
npm install
```

### 后端依赖

```bash
pip install -r backend/requirements.txt
```

### Electron 桌面应用（可选）

```bash
# 开发模式启动 Electron
npm run dev
```

> [!NOTE]
> Electron 模式下会自动启动 Python 后端子进程，无需手动运行 `python backend/main.py`。文件选择与导出使用系统原生对话框（拖拽上传与浏览器模式同样可用）。

## 💡 Usage

### 基本流程

1. 启动应用后，将音频文件拖入中央区域
2. 等待 ASR 转录完成，查看带时间戳的文字稿
3. 点击「提取纪要」按钮，LLM 自动分析并生成结构化纪要
4. 切换 Tab 查看文字稿或纪要，点击「导出 Markdown」保存

### 配置

点击左下角「设置」，在一个面板里配置 LLM 提取和 ASR 转录，保存即生效并持久化到 `data/config.json`（重启不丢）。每个配置项旁标注来源——`环境变量` / `文件` / `默认`：环境变量优先级最高（便于部署覆盖），其次是配置文件，最后是代码默认值。被环境变量覆盖的项面板锁定不可改。

#### LLM 提取

先选 API 协议，再填入地址和密钥：

| 字段 | 说明 | 示例 |
|------|------|------|
| API 协议 | `OpenAI 兼容` 或 `Anthropic Claude` | 默认 OpenAI 兼容 |
| API Base URL | API 地址（切换协议会自动填默认值） | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| API Key | API 密钥 | `sk-xxx` |
| 模型名称 | 使用的模型 | `qwen-plus` / `claude-sonnet-5` |

两种协议：

- **OpenAI 兼容**（默认，百炼）：适用于通义千问（Qwen）、智谱 GLM、DeepSeek、OpenAI 等任意 OpenAI 兼容服务。默认填入百炼地址和 `qwen-plus`。
- **Anthropic Claude**：适用于 Anthropic 官方 API。默认填入 `https://api.anthropic.com` 和 `claude-sonnet-5`，填入你的 Anthropic API Key 即可。

填好后点「测试连通」可验证 API 是否可达（发一个极短请求，显示延迟或错误）。

### 本地 ASR 转录

ASR 模块基于 [faster-whisper](https://github.com/SYSTRAN/faster-whisper)（Whisper 的 CTranslate2 实现），全程本地转录，音频不出本机。首次使用会自动从 HuggingFace 下载模型（`small` 约 240MB，仅一次）。

ASR 配置同样在「设置」面板里改，保存即生效：改模型/设备/精度会在下次转录时重新加载模型，改语言即时生效。也可用环境变量配置（优先级高于配置文件，便于部署）：

| 环境变量 | 说明 | 默认值 |
|----------|------|--------|
| `ASR_ENGINE` | `whisper` 真实转录 / `mock` 假数据回退 | `whisper` |
| `ASR_MODEL` | 模型大小：`tiny`/`base`/`small`/`medium`/`large-v3` | `small` |
| `ASR_LANGUAGE` | 语言：`zh`/`en`/`auto` | `zh` |
| `ASR_DEVICE` | `cpu` / `cuda` | `cpu` |
| `ASR_COMPUTE_TYPE` | `int8`（CPU 最快）/ `float16`（GPU） | `int8` |

```bash
# 示例：用 GPU + medium 模型转录
$env:ASR_DEVICE='cuda'; $env:ASR_MODEL='medium'; python backend/main.py
```

> [!NOTE]
> 未安装模型时，可在面板把引擎切到 `mock` 回退到假数据，便于前端联调和测试。

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Electron 主进程                              │
│  窗口管理 · IPC 通信 · Python 子进程          │
├─────────────────────────────────────────────┤
│  React 前端 (Vite + Tailwind CSS)            │
│  拖拽上传 · 转录展示 · 纪要展示 · 设置面板    │
├─────────────────────────────────────────────┤
│  Python 后端 (FastAPI)                       │
│  ASR 转录 · LLM 提取 · SQLite · 导出         │
└─────────────────────────────────────────────┘
```

### 目录结构

```
MeetingScribe/
├── electron/           # Electron 主进程
│   ├── main.js         # 窗口管理、IPC
│   └── preload.js      # 上下文桥接
├── src/                # React 前端
│   ├── App.jsx         # 主组件
│   └── components/     # UI 组件
├── backend/            # Python 后端
│   ├── main.py         # FastAPI 入口
│   ├── asr.py          # ASR 模块
│   ├── llm.py          # LLM 模块
│   └── db.py           # 数据库操作
└── data/               # SQLite 数据库
```

## 🗺️ Roadmap

| 领域 | 功能 | 状态 |
|------|------|------|
| 核心 | 拖拽上传 + ASR 转录 | ✅ |
| 核心 | LLM 结构化提取 | ✅ |
| 核心 | Markdown 导出 | ✅ |
| 核心 | 历史记录管理 | ✅ |
| ASR | 本地 ASR（faster-whisper） | ✅ |
| 进阶 | 实时录音 + 实时转录 | 📋 |
| 进阶 | 多语言支持（中英混合） | 📋 |
| 进阶 | 日历应用集成 | 📋 |
| 进阶 | PDF 导出 | 📋 |

## ❓ FAQ

<details>
<summary>音频数据会被上传到云端吗？</summary>

不会。ASR 转录在本地完成，音频文件不会离开你的电脑。仅在调用 LLM 提取纪要时，转录后的文字稿会发送到你配置的 API 服务。你也可以配置本地部署的 LLM 实现完全离线使用。

</details>

<details>
<summary>支持哪些音频格式？</summary>

目前支持 mp3、wav、m4a 三种常见格式。后续可扩展更多格式支持。

</details>

<details>
<summary>如何更换 LLM 服务？</summary>

点击左下角「LLM 设置」，先选 API 协议（OpenAI 兼容或 Anthropic），再修改 API Base URL、API Key 和模型名称即可。支持任意 OpenAI 兼容服务或 Anthropic 官方 API。

</details>

<details>
<summary>首次转录很慢 / 在下载什么？</summary>

首次转录会从 HuggingFace 下载 Whisper 模型（`small` 约 240MB），仅一次，之后离线可用。想更快可换 `tiny`/`base`，想更准可换 `medium`/`large-v3`：设置环境变量 `ASR_MODEL` 即可。

</details>

## 📄 License

本项目暂未指定许可证。

---

<div align="center">

**如果觉得有用，欢迎 Star 支持！**

</div>
