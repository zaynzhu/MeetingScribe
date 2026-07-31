import React from 'react'
import { Check } from './Icons'

// 深色 toast 通知，替代系统 alert
export default function Toast({ msg, type }) {
  if (!msg) return null
  const ok = type !== 'error'
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-[fadeIn_0.15s_ease-out]">
      <div className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border shadow-2xl text-sm bg-[#0f141d] ${ok ? 'border-lime-500/30 text-lime-400' : 'border-red-500/30 text-red-400'}`}>
        {ok ? <Check width={16} height={16} /> : <span className="font-bold">✕</span>}
        <span className="text-gray-200">{msg}</span>
      </div>
    </div>
  )
}