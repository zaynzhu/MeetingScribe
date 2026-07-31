<div align="center">

# 🎙️ MeetingScribe

Meeting recordings to structured minutes — local ASR + LLM, your data stays on your machine

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
> MeetingScribe is a privacy-first desktop app that automatically transforms meeting recordings into structured minutes.
> ASR transcription runs entirely on your local machine — only the LLM extraction step calls an external API (with configurable private deployment options).
> Supports drag-and-drop upload, one-click extraction of summaries, decisions, action items, and timelines, with Markdown export.

## ✨ Features

- **Drag & Drop Upload** -- Drop in mp3/wav/m4a audio files with zero learning curve
- **Local ASR Transcription** -- Runs on-device via faster-whisper, audio never leaves your machine
- **LLM Structured Extraction** -- Supports both OpenAI-compatible and Anthropic protocols, automatically extracts summaries, decisions, action items, and timelines
- **Action Item Tracking** -- Automatically identifies owners and deadlines at a glance
- **Timeline Review** -- Segmented by topic with time ranges, structured overview of the meeting flow
- **History Management** -- SQLite local storage for reviewing past meetings anytime
- **Markdown Export** -- One-click export of formatted minutes for sharing and archiving
- **Configurable API** -- Supports any OpenAI-compatible service (Qwen, GLM, DeepSeek, etc.)

## 🚀 Quick Start

```bash
# Clone the project
git clone <repo-url>
cd MeetingScribe

# Install frontend dependencies
npm install

# Install backend dependencies
pip install -r backend/requirements.txt

# Start the backend
python backend/main.py

# Start the frontend (new terminal)
npm run dev:frontend
```

Open your browser and visit `http://localhost:5173`, then drag in an audio file to get started.

## 📦 Installation

### Prerequisites

- Node.js >= 18
- Python >= 3.10
- npm or pnpm

### Frontend Dependencies

```bash
npm install
```

### Backend Dependencies

```bash
pip install -r backend/requirements.txt
```

### Electron Desktop App (Optional)

```bash
# Start Electron in dev mode
npm run dev
```

> [!NOTE]
> In Electron mode, the Python backend subprocess starts automatically — no need to run `python backend/main.py` manually. File picking and export use native OS dialogs (drag-and-drop upload and browser mode also work).

## 💡 Usage

### Basic Workflow

1. Launch the app and drag an audio file into the center area
2. Wait for ASR transcription to complete, then review the timestamped transcript
3. Click the "Extract Minutes" button — the LLM automatically analyzes and generates structured minutes
4. Switch between tabs to view the transcript or minutes, click "Export Markdown" to save

### Configuration

Click "Settings" in the bottom-left corner to configure both LLM extraction and ASR transcription in one panel. Changes take effect on save and persist to `data/config.json` (survive restart). Each field shows its source — `env` / `file` / `default`: environment variables take precedence (handy for deployment), then the config file, then code defaults. Fields overridden by an env var are locked in the panel.

#### LLM Extraction

Pick an API protocol, then fill in the endpoint and key:

| Field | Description | Example |
|-------|-------------|---------|
| API Protocol | `OpenAI-compatible` or `Anthropic Claude` | defaults to OpenAI-compatible |
| API Base URL | API endpoint (switching protocol auto-fills the default) | `https://dashscope.aliyuncs.com/compatible-mode/v1` |
| API Key | API secret key | `sk-xxx` |
| Model Name | Model to use | `qwen-plus` / `claude-sonnet-5` |

Two protocols:

- **OpenAI-compatible** (default, DashScope/Bailian): works with Qwen, GLM, DeepSeek, OpenAI, and any OpenAI-compatible service. Defaults to the Bailian endpoint and `qwen-plus`.
- **Anthropic Claude**: for the official Anthropic API. Defaults to `https://api.anthropic.com` and `claude-sonnet-5` — just paste your Anthropic API Key.

Click "Test connection" to verify the API is reachable (sends a tiny request, shows latency or error).

### Local ASR Transcription

The ASR module is built on [faster-whisper](https://github.com/SYSTRAN/faster-whisper) (a CTranslate2 implementation of Whisper). Transcription runs fully on-device. The first run downloads the model from HuggingFace automatically (`small` is about 240MB, one-time only).

ASR settings are also in the "Settings" panel and take effect on save: changing model/device/compute type reloads the model on the next transcription; changing language is immediate. Environment variables still work and take precedence over the config file (handy for deployment):

| Variable | Description | Default |
|----------|-------------|---------|
| `ASR_ENGINE` | `whisper` (real) / `mock` (fake-data fallback) | `whisper` |
| `ASR_MODEL` | Model size: `tiny`/`base`/`small`/`medium`/`large-v3` | `small` |
| `ASR_LANGUAGE` | Language: `zh`/`en`/`auto` | `zh` |
| `ASR_DEVICE` | `cpu` / `cuda` | `cpu` |
| `ASR_COMPUTE_TYPE` | `int8` (fastest on CPU) / `float16` (GPU) | `int8` |

```bash
# Example: GPU + medium model
$env:ASR_DEVICE='cuda'; $env:ASR_MODEL='medium'; python backend/main.py
```

> [!NOTE]
> Set the engine to `mock` in the panel to fall back to fake data when no model is installed — handy for frontend integration and testing.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Electron Main Process                      │
│  Window Management · IPC · Python Subprocess│
├─────────────────────────────────────────────┤
│  React Frontend (Vite + Tailwind CSS)       │
│  Upload · Transcript · Minutes · Settings   │
├─────────────────────────────────────────────┤
│  Python Backend (FastAPI)                   │
│  ASR · LLM Extraction · SQLite · Export     │
└─────────────────────────────────────────────┘
```

### Project Structure

```
MeetingScribe/
├── electron/           # Electron main process
│   ├── main.js         # Window management, IPC
│   └── preload.js      # Context bridge
├── src/                # React frontend
│   ├── App.jsx         # Main component
│   └── components/     # UI components
├── backend/            # Python backend
│   ├── main.py         # FastAPI entry point
│   ├── asr.py          # ASR module
│   ├── llm.py          # LLM module
│   └── db.py           # Database operations
└── data/               # SQLite database
```

## 🗺️ Roadmap

| Area | Feature | Status |
|------|---------|--------|
| Core | Drag & drop upload + ASR transcription | ✅ |
| Core | LLM structured extraction | ✅ |
| Core | Markdown export | ✅ |
| Core | History management | ✅ |
| ASR | Local ASR (faster-whisper) | ✅ |
| Advanced | Real-time recording + live transcription | 📋 |
| Advanced | Multilingual support (Chinese-English mixed) | 📋 |
| Advanced | Calendar app integration | 📋 |
| Advanced | PDF export | 📋 |

## ❓ FAQ

<details>
<summary>Is my audio data uploaded to the cloud?</summary>

No. ASR transcription runs locally — your audio files never leave your machine. Only the transcribed text is sent to your configured API service when extracting minutes. You can also configure a locally deployed LLM for fully offline usage.

</details>

<details>
<summary>What audio formats are supported?</summary>

Currently mp3, wav, and m4a. More format support is planned for future releases.

</details>

<details>
<summary>How do I switch LLM services?</summary>

Click "LLM Settings" in the bottom-left corner, pick the API protocol (OpenAI-compatible or Anthropic), then update the API Base URL, API Key, and Model Name. Any OpenAI-compatible service or the Anthropic API is supported.

</details>

<details>
<summary>The first transcription is slow / what is being downloaded?</summary>

The first transcription downloads a Whisper model from HuggingFace (`small` is about 240MB). It happens once, then works offline. Use `tiny`/`base` for speed or `medium`/`large-v3` for accuracy by setting the `ASR_MODEL` environment variable.

</details>

## 📄 License

This project does not currently specify a license.

---

<div align="center">

**If you find this useful, feel free to give it a Star!**

</div>
