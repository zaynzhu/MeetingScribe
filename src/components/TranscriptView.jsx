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
      <div className="flex items-center justify-center h-full text-gray-600">
        <p className="text-sm">转录完成后将在此显示文字稿</p>
      </div>
    )
  }

  return (
    <div className="space-y-0.5 p-4">
      {segments.map((seg, i) => (
        <div key={i} className="flex gap-4 py-2.5 px-3 rounded-lg hover:bg-white/[0.03] transition-colors">
          {seg.start && (
            <span className="tstamp shrink-0 text-xs text-lime-500/80 pt-0.5 w-28 shrink-0">
              {seg.start}
            </span>
          )}
          <p className="text-sm text-gray-300 leading-relaxed">{seg.text}</p>
        </div>
      ))}
    </div>
  )
}