import { useState, forwardRef, useImperativeHandle } from 'react'
import { message, Spin } from 'antd'
import { hc } from 'hono/client'
import type { AppType } from '../../../../server'
import { useTemplates } from '../../../hooks/useTemplates'
import { TemplateFolder } from './TemplateFolder'
import { TemplateItemList } from './TemplateItemList'

const client = hc<AppType>('/')

export interface TemplateListRef {
  refresh: () => void
}

export const TemplateList = forwardRef<TemplateListRef, unknown>((_, ref) => {
  const [selectedSource, setSelectedSource] = useState<
    'video' | 'image' | null
  >(null)

  const { data: templates = [], loading, refresh } = useTemplates()

  useImperativeHandle(ref, () => ({
    refresh
  }))

  const handleDelete = async (id: string) => {
    try {
      const res = await client.api.template[':id'].$delete({ param: { id } })
      const json = await res.json()
      if (json.success) {
        message.success('删除成功')
        refresh()
      } else {
        message.error(json.error || '删除失败')
      }
    } catch (error) {
      message.error('请求失败')
    }
  }

  const renderTemplateList = () => {
    if (selectedSource === null) {
      const wanCount = templates.filter((t) => t.usageType === 'video').length
      const geminiCount = templates.filter(
        (t) => t.usageType === 'image'
      ).length

      return (
        <TemplateFolder
          wanCount={wanCount}
          geminiCount={geminiCount}
          onSelect={setSelectedSource}
        />
      )
    }

    const filteredTemplates = templates.filter(
      (t) => t.usageType === selectedSource
    )

    return (
      <TemplateItemList
        selectedSource={selectedSource}
        filteredTemplates={filteredTemplates}
        onBack={() => setSelectedSource(null)}
        onDelete={handleDelete}
      />
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-800 m-0">
          已有模板 ({templates.length})
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Spin />
        </div>
      ) : (
        renderTemplateList()
      )}
    </div>
  )
})
