import { ScheduleOutlined, InboxOutlined } from '@ant-design/icons'

export function TaskSection() {
  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 flex items-center justify-center">
          <ScheduleOutlined className="text-xl" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          任务编排
        </h2>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 transition-all hover:shadow-md">
        <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
          <InboxOutlined className="text-5xl text-slate-300" />
          <p className="text-sm font-medium">暂无具体内容</p>
        </div>
      </div>
    </section>
  )
}
