import React from 'react'

export default function HistoryPanel({ meetings, currentId, onSelect, onDelete }) {
  if (!meetings || meetings.length === 0) {
    return (
      <div className="p-4 text-center text-slate-400 text-sm">
        <p>暂无历史记录</p>
      </div>
    )
  }

  return (
    <div className="space-y-1 p-2">
      {meetings.map((m) => (
        <div
          key={m.id}
          className={`
            group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors
            ${m.id === currentId
              ? 'bg-blue-50 border border-blue-200'
              : 'hover:bg-slate-50 border border-transparent'
            }
          `}
          onClick={() => onSelect(m.id)}
        >
          <span className="text-lg shrink-0">🎤</span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${m.id === currentId ? 'text-blue-700' : 'text-slate-700'}`}>
              {m.filename}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {m.created_at?.slice(0, 16).replace('T', ' ')}
            </p>
          </div>
          <button
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 text-sm transition-opacity shrink-0"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(m.id)
            }}
            title="删除"
          >
            🗑
          </button>
        </div>
      ))}
    </div>
  )
}
