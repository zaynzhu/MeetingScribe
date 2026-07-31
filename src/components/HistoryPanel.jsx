import React from 'react'
import { Mic, Trash } from './Icons'

export default function HistoryPanel({ meetings, currentId, onSelect, onDelete }) {
  if (!meetings || meetings.length === 0) {
    return (
      <div className="p-4 text-center text-gray-600 text-sm">
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
            group flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors border
            ${m.id === currentId
              ? 'bg-lime-500/10 border-lime-500/30'
              : 'hover:bg-white/[0.04] border-transparent'
            }
          `}
          onClick={() => onSelect(m.id)}
        >
          <span className={`shrink-0 ${m.id === currentId ? 'text-lime-400' : 'text-gray-600'}`}>
            <Mic width={15} height={15} />
          </span>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium truncate ${m.id === currentId ? 'text-gray-100' : 'text-gray-300'}`}>
              {m.filename}
            </p>
            <p className="text-xs text-gray-600 truncate tstamp">
              {m.created_at?.slice(0, 16).replace('T', ' ')}
            </p>
          </div>
          <button
            className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-opacity shrink-0"
            onClick={(e) => { e.stopPropagation(); onDelete(m.id) }}
            title="删除"
          >
            <Trash width={14} height={14} />
          </button>
        </div>
      ))}
    </div>
  )
}