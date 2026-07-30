import React from 'react'

export default function MinutesView({ minutes }) {
  if (!minutes) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400">
        <p>点击"提取纪要"后将在此显示结构化结果</p>
      </div>
    )
  }

  const { summary, decisions, actions, timeline } = minutes

  return (
    <div className="p-4 space-y-6">
      {/* 会议摘要 */}
      {summary && (
        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <span className="w-1 h-5 bg-blue-500 rounded-full inline-block"></span>
            会议摘要
          </h3>
          <p className="text-sm text-slate-600 leading-relaxed bg-blue-50/50 rounded-lg p-4">
            {summary}
          </p>
        </section>
      )}

      {/* 关键决策 */}
      {decisions && decisions.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <span className="w-1 h-5 bg-amber-500 rounded-full inline-block"></span>
            关键决策
          </h3>
          <ul className="space-y-2">
            {decisions.map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="shrink-0 w-5 h-5 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                  {i + 1}
                </span>
                <span>{typeof d === 'string' ? d : JSON.stringify(d)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 行动项 */}
      {actions && actions.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <span className="w-1 h-5 bg-green-500 rounded-full inline-block"></span>
            行动项
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 px-3 font-medium text-slate-500">任务</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500 w-24">负责人</th>
                  <th className="text-left py-2 px-3 font-medium text-slate-500 w-32">截止日期</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a, i) => (
                  <tr key={i} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-2.5 px-3 text-slate-700">{a.task}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        {a.owner || '待定'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{a.deadline || '待定'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 会议时间线 */}
      {timeline && timeline.length > 0 && (
        <section>
          <h3 className="text-base font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <span className="w-1 h-5 bg-purple-500 rounded-full inline-block"></span>
            会议时间线
          </h3>
          <div className="relative pl-6">
            {/* 竖线 */}
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-purple-200"></div>

            <div className="space-y-4">
              {timeline.map((t, i) => (
                <div key={i} className="relative">
                  {/* 圆点 */}
                  <div className="absolute -left-[18px] top-1.5 w-3 h-3 bg-purple-400 rounded-full border-2 border-white"></div>
                  <div className="bg-white rounded-lg border border-slate-100 p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                        {t.time_range}
                      </span>
                      <span className="text-sm font-medium text-slate-700">{t.topic}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{t.summary}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
