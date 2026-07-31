import React, { useState, useEffect } from 'react'
import { Settings as SettingsIcon, Check } from './Icons'

// 各 LLM 协议的默认配置，切换协议时自动填入
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

const ASR_OPTIONS = {
  engine: [['whisper', 'Whisper（本地）'], ['mock', 'Mock（假数据）']],
  model: ['tiny', 'base', 'small', 'medium', 'large-v3'],
  language: [['zh', '中文'], ['en', '英文'], ['auto', '自动检测']],
  device: [['cpu', 'CPU'], ['cuda', 'CUDA GPU']],
  compute_type: [['int8', 'int8（CPU 最快）'], ['int8_float16', 'int8_float16'], ['float16', 'float16（GPU）']],
}

const SOURCE_LABEL = {
  env: { text: '环境变量', cls: 'bg-amber-500/15 text-amber-400' },
  file: { text: '文件', cls: 'bg-lime-500/15 text-lime-400' },
  default: { text: '默认', cls: 'bg-white/5 text-gray-500' },
}

const inputCls = 'w-full px-3 py-2 bg-white/[0.04] border border-white/10 rounded-lg text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-lime-500/40 focus:border-lime-500/40 disabled:opacity-60 disabled:bg-white/[0.02]'
const selectCls = inputCls + ' bg-[#11161f]'

function SourceBadge({ source }) {
  const s = SOURCE_LABEL[source] || SOURCE_LABEL.default
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-medium ${s.cls}`}>
      {s.text}
    </span>
  )
}

export default function SettingsPanel({ backendUrl, onClose }) {
  const [provider, setProvider] = useState('openai')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [model, setModel] = useState('')

  const [asrEngine, setAsrEngine] = useState('whisper')
  const [asrModel, setAsrModel] = useState('small')
  const [asrLanguage, setAsrLanguage] = useState('zh')
  const [asrDevice, setAsrDevice] = useState('cpu')
  const [asrComputeType, setAsrComputeType] = useState('int8')

  const [sources, setSources] = useState({})
  const [savingLlm, setSavingLlm] = useState(false)
  const [savingAsr, setSavingAsr] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [message, setMessage] = useState('')

  const loadConfig = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/config`)
      const data = await res.json()
      const v = data.values
      setSources(data.sources || {})
      setProvider(v.llm.provider)
      setBaseUrl(v.llm.base_url)
      setApiKey('')
      setModel(v.llm.model)
      setAsrEngine(v.asr.engine)
      setAsrModel(v.asr.model)
      setAsrLanguage(v.asr.language)
      setAsrDevice(v.asr.device)
      setAsrComputeType(v.asr.compute_type)
    } catch (e) {
      setMessage('加载配置失败')
    }
  }

  useEffect(() => { loadConfig() }, [backendUrl])

  const handleProviderChange = (p) => {
    setProvider(p)
    const def = PROVIDER_DEFAULTS[p]
    setBaseUrl(def.base_url)
    setModel(def.model)
    setApiKey('')
  }

  const handleSaveLlm = async () => {
    setSavingLlm(true)
    setMessage('')
    try {
      const res = await fetch(`${backendUrl}/api/config/llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          base_url: baseUrl || undefined,
          api_key: apiKey || undefined,
          model: model || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSources(data.sources || {})
        setApiKey('')
        setMessage('LLM 配置已保存')
        setTimeout(() => setMessage(''), 2000)
      } else {
        setMessage('保存失败')
      }
    } catch (e) {
      setMessage('网络错误')
    }
    setSavingLlm(false)
  }

  const handleSaveAsr = async () => {
    setSavingAsr(true)
    setMessage('')
    try {
      const res = await fetch(`${backendUrl}/api/config/asr`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engine: asrEngine,
          model: asrModel,
          language: asrLanguage,
          device: asrDevice,
          compute_type: asrComputeType,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        setSources(data.sources || {})
        setMessage('ASR 配置已保存')
        setTimeout(() => setMessage(''), 2000)
      } else {
        setMessage('保存失败')
      }
    } catch (e) {
      setMessage('网络错误')
    }
    setSavingAsr(false)
  }

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${backendUrl}/api/config/llm/test`, { method: 'POST' })
      setTestResult(await res.json())
    } catch (e) {
      setTestResult({ ok: false, error: '网络错误' })
    }
    setTesting(false)
  }

  const isEnv = (key) => sources[key] === 'env'

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0f141d] border border-white/10 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-100 flex items-center gap-2">
            <span className="text-lime-400"><SettingsIcon width={18} height={18} /></span>
            设置
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-200 text-xl leading-none">✕</button>
        </div>

        {/* LLM 配置 */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-1 border-b border-white/5">LLM 提取</h3>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-300">API 协议</label>
              <SourceBadge source={sources['llm.provider']} />
            </div>
            <select value={provider} onChange={e => handleProviderChange(e.target.value)} className={selectCls}>
              {Object.entries(PROVIDER_DEFAULTS).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <Field label="API Base URL" source={sources['llm.base_url']} disabled={isEnv('llm.base_url')}>
            <input type="text" value={baseUrl} disabled={isEnv('llm.base_url')}
              onChange={e => setBaseUrl(e.target.value)}
              placeholder={PROVIDER_DEFAULTS[provider].base_url}
              className={inputCls} />
          </Field>

          <Field label="API Key" source={sources['llm.api_key']} disabled={isEnv('llm.api_key')}>
            <input type="password" value={apiKey} disabled={isEnv('llm.api_key')}
              onChange={e => setApiKey(e.target.value)}
              placeholder={sources['llm.api_key'] === 'file' ? '已配置，修改请输入新 Key' : 'sk-...'}
              className={inputCls} />
          </Field>

          <Field label="模型名称" source={sources['llm.model']} disabled={isEnv('llm.model')}>
            <input type="text" value={model} disabled={isEnv('llm.model')}
              onChange={e => setModel(e.target.value)}
              placeholder={PROVIDER_DEFAULTS[provider].model}
              className={inputCls} />
          </Field>

          <div className="flex items-center gap-2 pt-1">
            <button onClick={handleSaveLlm} disabled={savingLlm}
              className="px-4 py-2 text-sm bg-lime-500 text-[#0b0f17] font-medium rounded-lg hover:bg-lime-400 disabled:opacity-50">
              {savingLlm ? '保存中...' : '保存 LLM'}
            </button>
            <button onClick={handleTest} disabled={testing}
              className="px-4 py-2 text-sm text-gray-300 border border-white/10 rounded-lg hover:bg-white/5 disabled:opacity-50">
              {testing ? '测试中...' : '测试连通'}
            </button>
          </div>
          {testResult && (
            <p className={`text-xs px-3 py-2 rounded-lg flex items-center gap-1.5 ${testResult.ok ? 'bg-lime-500/10 text-lime-400' : 'bg-red-500/10 text-red-400'}`}>
              {testResult.ok ? <><Check width={14} height={14} /> 连通成功，延迟 {testResult.latency_ms}ms</> : `✕ 失败：${testResult.error}`}
            </p>
          )}
        </section>

        {/* ASR 配置 */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider pb-1 border-b border-white/5">ASR 转录</h3>

          <SelectField label="引擎" source={sources['asr.engine']} value={asrEngine}
            disabled={isEnv('asr.engine')} onChange={setAsrEngine} options={ASR_OPTIONS.engine} />
          <SelectField label="模型大小" source={sources['asr.model']} value={asrModel}
            disabled={isEnv('asr.model')} onChange={setAsrModel} options={ASR_OPTIONS.model} />
          <SelectField label="语言" source={sources['asr.language']} value={asrLanguage}
            disabled={isEnv('asr.language')} onChange={setAsrLanguage} options={ASR_OPTIONS.language} />
          <SelectField label="设备" source={sources['asr.device']} value={asrDevice}
            disabled={isEnv('asr.device')} onChange={setAsrDevice} options={ASR_OPTIONS.device} />
          <SelectField label="计算精度" source={sources['asr.compute_type']} value={asrComputeType}
            disabled={isEnv('asr.compute_type')} onChange={setAsrComputeType} options={ASR_OPTIONS.compute_type} />

          <button onClick={handleSaveAsr} disabled={savingAsr}
            className="px-4 py-2 text-sm bg-lime-500 text-[#0b0f17] font-medium rounded-lg hover:bg-lime-400 disabled:opacity-50">
            {savingAsr ? '保存中...' : '保存 ASR'}
          </button>
          <p className="text-xs text-gray-600">改模型/设备/精度会在下次转录时重新加载；改语言即时生效。</p>
        </section>

        {message && (
          <p className={`text-sm text-center ${message.includes('已保存') ? 'text-lime-400' : 'text-red-400'}`}>{message}</p>
        )}

        <div className="flex justify-end pt-2 border-t border-white/5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg">关闭</button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, source, disabled, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-sm font-medium text-gray-300">
          {label}
          {disabled && <span className="ml-1.5 text-[10px] text-amber-400/80">被环境变量覆盖</span>}
        </label>
        <SourceBadge source={source} />
      </div>
      {children}
    </div>
  )
}

function SelectField({ label, source, value, disabled, onChange, options }) {
  return (
    <Field label={label} source={source} disabled={disabled}>
      <select value={value} disabled={disabled} onChange={e => onChange(e.target.value)} className={selectCls}>
        {options.map((opt) => {
          const [val, text] = Array.isArray(opt) ? opt : [opt, opt]
          return <option key={val} value={val}>{text}</option>
        })}
      </select>
    </Field>
  )
}