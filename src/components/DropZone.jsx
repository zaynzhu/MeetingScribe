import React, { useState, useRef } from 'react'

// Electron 模式下有 preload 暴露的 selectFile，可走本地路径转录
const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.selectFile

const ACCEPTED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/x-m4a', 'audio/mp4', 'audio/ogg']
const ACCEPTED_EXTS = ['.mp3', '.wav', '.m4a']

export default function DropZone({ onFileSelected, onLocalPath, disabled }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const validateFile = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase()
    if (!ACCEPTED_EXTS.includes(ext)) {
      return '仅支持 mp3、wav、m4a 格式的音频文件'
    }
    if (file.size > 2 * 1024 * 1024 * 1024) {
      return '文件大小不能超过 2GB'
    }
    return null
  }

  const handleFile = (file) => {
    setError('')
    const err = validateFile(file)
    if (err) {
      setError(err)
      return
    }
    onFileSelected(file)
  }

  // Electron 模式：调主进程原生文件选择框，拿到本地路径直接交给后端转录
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

  const handleDragOver = (e) => {
    e.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClick = () => {
    if (!disabled) fileInputRef.current?.click()
  }

  const handleInputChange = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
        transition-all duration-200 ease-out
        ${disabled
          ? 'border-slate-200 bg-slate-50 cursor-not-allowed opacity-60'
          : isDragging
            ? 'border-blue-500 bg-blue-50 scale-[1.02] shadow-lg shadow-blue-100'
            : 'border-slate-300 bg-white hover:border-blue-400 hover:bg-blue-50/50'
        }
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.m4a"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-4">
        {/* 图标 */}
        <div className={`
          w-16 h-16 rounded-full flex items-center justify-center text-3xl
          ${isDragging ? 'bg-blue-100' : 'bg-slate-100'}
        `}>
          {isDragging ? '📥' : '🎵'}
        </div>

        {/* 文字 */}
        <div>
          <p className="text-lg font-medium text-slate-700">
            {isDragging ? '松开即可上传' : '拖拽音频文件到此处'}
          </p>
          <p className="text-sm text-slate-400 mt-1">
            支持 mp3、wav、m4a 格式，最大 2GB
          </p>
        </div>

        {/* 按钮 */}
        {!isDragging && !disabled && (
          <div className="flex gap-2 justify-center">
            <button className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              或点击选择文件
            </button>
            {isElectron && (
              <button
                onClick={handleSelectLocal}
                className="px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                从本地选择
              </button>
            )}
          </div>
        )}
      </div>

      {/* 错误提示 */}
      {error && (
        <p className="mt-4 text-sm text-red-500 bg-red-50 rounded-lg py-2 px-4">
          {error}
        </p>
      )}
    </div>
  )
}