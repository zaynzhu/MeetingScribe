import React, { useState, useEffect } from 'react'

// 各协议的默认配置，切换协议时自动填入
const PROVIDER_DEFAULTS = {
  openai: {
    label: 'OpenAI 兼容',
    base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-plus',
  },
  anthropic: {
    label: 'Anthropic Claude',
    base_url: 'https://api.anthropic.com',
    model: 'claude-sonnet-5',
  },
}

export default function SettingsPanel({ backendUrl, onClose }) {
  const [provider, setProvider] = useState('openai')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // 加载当前配置
  useEffect(() => {
    fetch(`${backendUrl}/api/config/llm`)
      .then(r => r.json())
      .then(data => {
        setProvider(data.provider || 'openai')
        setBaseUrl(data.base_url || '')
        setModel(data.model || '')
      })
      .catch(() => {})
  }, [backendUrl])

  // 切换协议：自动填入该协议默认 URL 和模型，清空旧 key
  const handleProviderChange = (p) => {
    setProvider(p)
    const def = PROVIDER_DEFAULTS[p]
    setBaseUrl(def.base_url)
    setModel(def.model)
    setApiKey('')
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch(`${backendUrl}/api/config/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: provider || undefined,
          base_url: baseUrl || undefined,
          api_key: apiKey || undefined,
          model: model || undefined,
        }),
      })
      if (res.ok) {
        setMessage('配置已保存')
        setTimeout(() => setMessage(''), 2000)
      } else {
        setMessage('保存失败')
      }
    } catch (e) {
      setMessage('网络错误')
    }
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-800">⚙️ LLM 设置</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">API 协议</label>
            <select
              value={provider}
              onChange={e => handleProviderChange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              {Object.entries(PROVIDER_DEFAULTS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              {provider === 'anthropic'
                ? '适用于 Anthropic Claude 官方 API'
                : '适用于百炼 / Qwen / GLM / DeepSeek / OpenAI 等兼容服务'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">API Base URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder={PROVIDER_DEFAULTS[provider].base_url}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">模型名称</label>
            <input
              type="text"
              value={model}
              onChange={e => setModel(e.target.value)}
              placeholder={PROVIDER_DEFAULTS[provider].model}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {message && (
          <p className={`text-sm text-center ${message.includes('已保存') ? 'text-green-600' : 'text-red-500'}`}>
            {message}
          </p>
        )}

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </div>
    </div>
  )
}