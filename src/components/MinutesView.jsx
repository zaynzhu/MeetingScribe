import React from 'react'

const SectionTitle = ({ children }) => (
  <h3 className="text-sm font-semibold text-gray-200 mb-2.5 flex items-center gap-2">
    <span className="w-1 h-4 bg-lime-400 rounded-full"></span>
    {children}
  </h3>
)

export default function MinutesView({ minutes }) {
  if (!minutes) {
    return (
      <div className="flex items-center justify-center h-full text-gray-600">
        <p className="text-sm">点击"提取纪要"后将在此显示结构化结果</p>
      </div>
    )
  }

  const { summary, decisions, actions, timeline } = minutes

  return (
    <div className="p-5 space-y-7">
      {summary && (
        <section>
          <SectionTitle>会议摘要</SectionTitle>
          <p className="text-sm text-gray-400 leading-relaxed bg-lime-500/[0.06] border border-lime-500/15 rounded-lg p-4">
            {summary}
          </p>
        </section>
      )}

      {decisions && decisions.length > 0 && (
        <section>
          <SectionTitle>关键决策</SectionTitle>
          <ul className="space-y-2">
            {decisions.map((d, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                <span className="shrink-0 w-5 h-5 bg-amber-500/15 text-amber-400 rounded-full flex items-center justify-center text-xs font-medium mt-0.5">
                  {i + 1}
                </span>
                <span>{typeof d === 'string' ? d : JSON.stringify(d)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {actions && actions.length > 0 && (
        <section>
          <SectionTitle>行动项</SectionTitle>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 px-3 font-medium text-gray-500">任务</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500 w-28">负责人</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500 w-32">截止</th>
                </tr>
              </thead>
              <tbody>
                {actions.map((a, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="py-2.5 px-3 text-gray-300">{a.task}</td>
                    <td className="py-2.5 px-3">
                      <span className="inline-block px-2 py-0.5 bg-lime-500/15 text-lime-400 rounded-full text-xs">
                        {a.owner || '待定'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500">{a.deadline || '待定'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {timeline && timeline.length > 0 && (
        <section>
          <SectionTitle>会议时间线</SectionTitle>
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-px bg-lime-500/20"></div>
            <div className="space-y-3">
              {timeline.map((t, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-[18px] top-1.5 w-2.5 h-2.5 bg-lime-400 rounded-full ring-4 ring-[#0b0f17]"></div>
                  <div className="bg-white/[0.03] border border-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="tstamp text-xs text-lime-400/80 bg-lime-500/10 px-2 py-0.5 rounded">
                        {t.time_range}
                      </span>
                      <span className="text-sm font-medium text-gray-200">{t.topic}</span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{t.summary}</p>
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