import React, { useState, useEffect, useCallback } from 'react'
import DropZone from './components/DropZone'
import TranscriptView from './components/TranscriptView'
import MinutesView from './components/MinutesView'
import HistoryPanel from './components/HistoryPanel'
import SettingsPanel from './components/SettingsPanel'
import ExportButton from './components/ExportButton'

export default function App() {
  // 后端地址：默认 8765，Electron 模式下从主进程获取实际地址
  const [backendUrl, setBackendUrl] = useState('http://127.0.0.1:8765')

  // 当前状态
  const [currentFile, setCurrentFile] = useState(null)
  const [currentMeeting, setCurrentMeeting] = useState(null)
  const [transcript, setTranscript] = useState('')
  const [minutes, setMinutes] = useState(null)
  const [activeTab, setActiveTab] = useState('transcript')

  // 进度状态
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [error, setError] = useState('')

  // 历史记录
  const [meetings, setMeetings] = useState([])

  // 设置面板
  const [showSettings, setShowSettings] = useState(false)

  // 加载历史记录
  const loadMeetings = useCallback(async () => {
    try {
      const res = await fetch(`${backendUrl}/api/meetings`)
      if (res.ok) {
        const data = await res.json()
        setMeetings(data)
      }
    } catch (e) {
      // 后端未就绪时忽略
    }
  }, [backendUrl])

  // Electron 模式下从主进程获取后端地址（浏览器模式保留默认值）
  useEffect(() => {
    if (window.electronAPI?.getBackendUrl) {
      window.electronAPI.getBackendUrl().then(setBackendUrl)
    }
  }, [])

  useEffect(() => {
    loadMeetings()
  }, [loadMeetings])

  // 处理文件上传和转录
  // 转录结果统一处理（multipart 上传与本地路径两条路径共用）
  const applyTranscriptResult = (data) => {
    setCurrentMeeting(data.meeting_id)
    setTranscript(data.transcript)
    loadMeetings()
  }

  const handleFileSelected = async (file) => {
    setError('')
    setCurrentFile(file)
    setTranscript('')
    setMinutes(null)
    setActiveTab('transcript')

    setIsTranscribing(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch(`${backendUrl}/api/transcribe`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || '转录失败')
      }

      applyTranscriptResult(await res.json())
    } catch (e) {
      setError(`转录失败: ${e.message}`)
    }
    setIsTranscribing(false)
  }

  // Electron 模式：直接传本地文件路径给后端转录，免上传
  const handleLocalPath = async (path) => {
    setError('')
    setCurrentFile({ name: path.split(/[\\/]/).pop() })
    setTranscript('')
    setMinutes(null)
    setActiveTab('transcript')

    setIsTranscribing(true)
    try {
      const res = await fetch(`${backendUrl}/api/transcribe/path`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || '转录失败')
      }

      applyTranscriptResult(await res.json())
    } catch (e) {
      setError(`转录失败: ${e.message}`)
    }
    setIsTranscribing(false)
  }

  // 调用 LLM 提取纪要
  const handleSummarize = async () => {
    if (!currentMeeting) return

    setError('')
    setIsSummarizing(true)
    try {
      const res = await fetch(`${backendUrl}/api/summarize/${currentMeeting}`, {
        method: 'POST',
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || '提取失败')
      }

      const data = await res.json()
      setMinutes(data)
      setActiveTab('minutes')
      loadMeetings()
    } catch (e) {
      setError(`纪要提取失败: ${e.message}`)
    }
    setIsSummarizing(false)
  }

  // 从历史记录加载
  const handleSelectMeeting = async (id) => {
    try {
      const res = await fetch(`${backendUrl}/api/meetings/${id}`)
      if (res.ok) {
        const data = await res.json()
        setCurrentMeeting(data.id)
        setCurrentFile({ name: data.filename })
        setTranscript(data.transcript || '')

        // 解析结构化字段
        const hasMinutes = data.summary || data.decisions || data.actions || data.timeline
        if (hasMinutes) {
          setMinutes({
            summary: data.summary || '',
            decisions: safeParse(data.decisions, []),
            actions: safeParse(data.actions, []),
            timeline: safeParse(data.timeline, []),
          })
          setActiveTab('minutes')
        } else {
          setMinutes(null)
          setActiveTab('transcript')
        }

        setError('')
      }
    } catch (e) {
      setError('加载失败')
    }
  }

  // 删除历史记录
  const handleDeleteMeeting = async (id) => {
    if (!confirm('确定要删除这条记录吗？')) return
    try {
      await fetch(`${backendUrl}/api/meetings/${id}`, { method: 'DELETE' })
      if (currentMeeting === id) {
        setCurrentMeeting(null)
        setCurrentFile(null)
        setTranscript('')
        setMinutes(null)
      }
      loadMeetings()
    } catch (e) {
      setError('删除失败')
    }
  }

  // 新建（重置状态）
  const handleNew = () => {
    setCurrentFile(null)
    setCurrentMeeting(null)
    setTranscript('')
    setMinutes(null)
    setError('')
    setActiveTab('transcript')
  }

  return (
    <div className="h-screen flex bg-slate-50">
      {/* 侧栏 - 历史记录 */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <span>🎙️</span> MeetingScribe
          </h1>
          <p className="text-xs text-slate-400 mt-1">会议录音转结构化纪要</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-2">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">历史记录</p>
          </div>
          <HistoryPanel
            meetings={meetings}
            currentId={currentMeeting}
            onSelect={handleSelectMeeting}
            onDelete={handleDeleteMeeting}
          />
        </div>

        <div className="p-3 border-t border-slate-100 space-y-2">
          <button
            onClick={handleNew}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <span>+</span> 新会议
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="w-full px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
          >
            <span>⚙️</span> 设置
          </button>
        </div>
      </aside>

      {/* 主区域 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 顶部栏 */}
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            {currentFile ? (
              <>
                <span className="text-lg">🎵</span>
                <div>
                  <p className="text-sm font-medium text-slate-700">{currentFile.name}</p>
                  <p className="text-xs text-slate-400">
                    {isTranscribing ? '正在转录...' : isSummarizing ? '正在提取纪要...' : transcript ? '转录完成' : ''}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">请拖入音频文件开始</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {transcript && (
              <button
                onClick={handleSummarize}
                disabled={isSummarizing || isTranscribing}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSummarizing ? (
                  <>
                    <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                    提取中...
                  </>
                ) : (
                  <>
                    <span>✨</span> 提取纪要
                  </>
                )}
              </button>
            )}
            {currentMeeting && (
              <ExportButton
                backendUrl={backendUrl}
                meetingId={currentMeeting}
                filename={currentFile?.name}
              />
            )}
          </div>
        </header>

        {/* 内容区 */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* 未选择文件时显示拖拽区 */}
          {!currentFile ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="w-full max-w-xl">
                <DropZone onFileSelected={handleFileSelected} onLocalPath={handleLocalPath} disabled={isTranscribing} />
              </div>
            </div>
          ) : (
            <>
              {/* Tab 切换 */}
              <div className="bg-white border-b border-slate-200 px-6 flex gap-0 shrink-0">
                <button
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'transcript'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                  onClick={() => setActiveTab('transcript')}
                >
                  📝 文字稿
                </button>
                <button
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'minutes'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                  onClick={() => setActiveTab('minutes')}
                >
                  📋 结构化纪要
                </button>
              </div>

              {/* Tab 内容 */}
              <div className="flex-1 overflow-y-auto">
                {/* 加载动画 */}
                {isTranscribing && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-3">
                      <div className="animate-spin w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full mx-auto"></div>
                      <p className="text-sm text-slate-500">正在转录音频...</p>
                    </div>
                  </div>
                )}

                {!isTranscribing && activeTab === 'transcript' && (
                  <TranscriptView transcript={transcript} />
                )}

                {!isTranscribing && activeTab === 'minutes' && (
                  <MinutesView minutes={minutes} />
                )}
              </div>
            </>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mx-6 mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
              <p className="text-sm text-red-600">{error}</p>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">×</button>
            </div>
          )}
        </div>
      </main>

      {/* 设置面板 */}
      {showSettings && (
        <SettingsPanel backendUrl={backendUrl} onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}

function safeParse(str, fallback) {
  if (!str) return fallback
  if (typeof str !== 'string') return str
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}
