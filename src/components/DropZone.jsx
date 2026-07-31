import React, { useState, useRef } from 'react'
import { Upload, Waveform } from './Icons'

// Electron 模式下有 preload 暴露的 selectFile，可走本地路径转录
const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.selectFile

const ACCEPTED_EXTS = ['.mp3', '.wav', '.m4a']

export default function DropZone({ onFileSelected, onLocalPath, disabled }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXTS.includes(ext)) return '仅支持 mp3、wav、m4a 格式的音频文件'
    if (file.size > 2 * 1024 * 1024 * 1024) return '文件大小不能超过 2GB'
    return null
  }

  const handleFile = (file) => {
    setError('')
    const err = validateFile(file)
    if (err) { setError(err); return }
    onFileSelected(file)
  }

  const handleSelectLocal = async (e) => {
    e.stopPropagation()
    if (disabled) return
    const filePath = await window.electronAPI.selectFile()
    if (filePath && onLocalPath) onLocalPath(filePath)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled) return
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-2xl px-8 py-14 text-center cursor-pointer
        transition-colors duration-150
        ${disabled
          ? 'border-white/10 bg-white/[0.02] cursor-not-allowed opacity-50'
          : isDragging
            ? 'border-lime-400 bg-lime-500/10'
            : 'border-white/10 bg-white/[0.02] hover:border-lime-400/50 hover:bg-lime-500/[0.04]'
        }
      `}
      onDrop={handleDrop}
      onDragOver={(e) => { e.preventDefault(); if (!disabled) setIsDragging(true) }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
      onClick={() => { if (!disabled) fileInputRef.current?.click() }}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a"
        className="hidden"
        onChange={(e) => { const f = e.target.files[0]; if (f) handleFile(f); e.target.value = '' }}
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-5">
        {/* 声波 signature：录音工具的视觉记忆点 */}
        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-lime-500/20 text-lime-300' : 'bg-white/5 text-lime-400/70'}`}>
          {isDragging ? <Upload width={28} height={28} /> : <Waveform className="w-12 h-6" />}
        </div>

        <div>
          <p className="text-lg font-semibold text-gray-100">
            {isDragging ? '松开即可上传' : '拖拽音频文件到此处'}
          </p>
          <p className="text-sm text-gray-500 mt-1.5">支持 mp3、wav、m4a，最大 2GB</p>
        </div>

        {!isDragging && !disabled && (
          <div className="flex gap-2 justify-center">
            <button className="px-5 py-2 bg-lime-500 text-[#0b0f17] text-sm font-medium rounded-lg hover:bg-lime-400 transition-colors">
              选择文件
            </button>
            {isElectron && (
              <button
                onClick={handleSelectLocal}
                className="px-5 py-2 bg-transparent text-lime-400 border border-lime-500/30 text-sm font-medium rounded-lg hover:bg-lime-500/10 transition-colors"
              >
                从本地选择
              </button>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-5 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg py-2 px-4">
          {error}
        </p>
      )}
    </div>
  )
}