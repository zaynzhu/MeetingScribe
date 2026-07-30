import React from 'react'

/**
 * 解析带时间戳的文字稿为段落数组
 * 格式：[00:00:00 - 00:00:15] 内容
 */
function parseTranscript(text) {
  if (!text) return []
  const lines = text.trim().split('\n').filter(Boolean)
  return lines.map((line) => {
    const match = line.match(/^\[(\d{2}:\d{2}:\d{2})\s*-\s*(\d{2}:\d{2}:\d{2})\]\s*(.*)$/)
    if (match) {
      return { start: match[1], end: match[2], text: match[3] }
    }
    return { start: '', end: '', text: line }
  })
}

export default function TranscriptView({ transcript }) {
  const segments = parseTranscript(transcript)

  if (!transcript) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p>转录完成后将在此显示文字稿</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-4">
      {segments.map((seg, i) => (
        <div key={i} className="flex gap-3 py-2 px-3 rounded-lg hover:bg-slate-50 group">
          {seg.start && (
            <span className="shrink-0 text-xs font-mono text-slate-400 pt-0.5 w-36">
              [{seg.start} → {seg.end}]
            </span>
          )}
          <p className="text-sm text-slate-700 leading-relaxed">{seg.text}</p>
        </div>
      ))}
    </div>
  )
}
