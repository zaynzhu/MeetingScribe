import React from 'react'

// 线条 SVG 图标，用 currentColor 跟随文字色，替代 emoji 去 AI 味
const base = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export const Mic = (p) => (
  <svg {...base} {...p}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0" /><path d="M12 17v4" /><path d="M8 21h8" /></svg>
)

export const Upload = (p) => (
  <svg {...base} {...p}><path d="M12 16V4" /><path d="M7 9l5-5 5 5" /><path d="M5 20h14" /></svg>
)

export const Plus = (p) => (
  <svg {...base} {...p}><path d="M12 5v14" /><path d="M5 12h14" /></svg>
)

export const Settings = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
)

export const Sparkles = (p) => (
  <svg {...base} {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z" /></svg>
)

export const Download = (p) => (
  <svg {...base} {...p}><path d="M12 4v12" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></svg>
)

export const FileText = (p) => (
  <svg {...base} {...p}><path d="M14 3v5h5" /><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M8 13h8" /><path d="M8 17h6" /></svg>
)

export const ListChecks = (p) => (
  <svg {...base} {...p}><path d="M3 6l2 2 3-3" /><path d="M3 14l2 2 3-3" /><path d="M11 6h10" /><path d="M11 14h10" /><path d="M11 19h6" /><path d="M3 19l1.5 1.5" /></svg>
)

export const Trash = (p) => (
  <svg {...base} {...p}><path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13" /><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></svg>
)

export const Play = (p) => (
  <svg {...base} {...p}><path d="M7 4l12 8-12 8z" /></svg>
)

export const Check = (p) => (
  <svg {...base} {...p}><path d="M5 12l5 5L20 7" /></svg>
)

// 声波图形：录音工具的 signature 装饰
export const Waveform = ({ bars = 7, className = '' }) => {
  const heights = [40, 70, 100, 55, 90, 35, 65]
  return (
    <svg viewBox="0 0 80 40" className={className} fill="currentColor" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => (
        <rect key={i} x={i * (80 / bars) + 2} y={(40 - (heights[i % heights.length])) / 2}
          width={80 / bars - 4} height={heights[i % heights.length]} rx={1.5} />
      ))}
    </svg>
  )
}