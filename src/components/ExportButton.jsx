import React, { useState } from 'react'

export default function ExportButton({ backendUrl, meetingId, filename }) {
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    if (!meetingId) return
    setExporting(true)

    try {
      const res = await fetch(`${backendUrl}/api/export/${meetingId}`)
      const data = await res.json()

      if (data.markdown) {
        if (window.electronAPI?.saveFile) {
          // Electron：原生保存对话框，主进程直接写文件
          const r = await window.electronAPI.saveFile(data.filename || '会议纪要.md', data.markdown)
          if (r && r.ok) {
            alert(`已保存到：${r.path}`)
          }
        } else {
          // 浏览器：Blob 触发下载
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
      alert('导出失败，请重试')
    }

    setExporting(false)
  }

  return (
    <button
      onClick={handleExport}
      disabled={!meetingId || exporting}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      <span>📄</span>
      {exporting ? '导出中...' : '导出 Markdown'}
    </button>
  )
}
