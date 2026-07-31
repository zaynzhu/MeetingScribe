import React, { useState } from 'react'
import { Download } from './Icons'

export default function ExportButton({ backendUrl, meetingId, filename, onNotify }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!meetingId) return
    setExporting(true)
    try {
      const res = await fetch(`${backendUrl}/api/export/${meetingId}`)
      const data = await res.json()
      if (data.markdown) {
        if (window.electronAPI?.saveFile) {
          const r = await window.electronAPI.saveFile(data.filename || '会议纪要.md', data.markdown)
          if (r && r.ok) onNotify(`已保存到：${r.path}`)
        } else {
          const blob = new Blob([data.markdown], { type: 'text/markdown;charset=utf-8' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = data.filename || '会议纪要.md'
          a.click()
          URL.revokeObjectURL(url)
        }
      }
    } catch (e) {
      console.error('导出失败:', e)
      onNotify('导出失败，请重试', 'error')
    }
    setExporting(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={!meetingId || exporting}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-300 border border-white/10 rounded-lg hover:bg-white/5 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <Download width={15} height={15} /> {exporting ? '导出中...' : '导出'}
    </button>
  )
}