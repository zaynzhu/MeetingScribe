import React from 'react'

// 深色确认对话框，替代系统 confirm
export default function ConfirmDialog({ msg, onOk, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-[#0f141d] border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-5">
        <p className="text-sm text-gray-200">{msg}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-gray-400 hover:bg-white/5 rounded-lg transition-colors">
            取消
          </button>
          <button onClick={onOk} className="px-4 py-2 text-sm bg-red-500/90 text-white rounded-lg hover:bg-red-500 transition-colors">
            删除
          </button>
        </div>
      </div>
    </div>
  )
}