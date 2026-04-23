import { useRef } from 'react'
import { TemplateForm } from './TemplateForm'
import { TemplateList, TemplateListRef } from './TemplateList'

export function TemplateSection() {
  const listRef = useRef<TemplateListRef>(null)

  const handleSuccess = () => {
    listRef.current?.refresh()
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左侧：表单 */}
      <TemplateForm onSuccess={handleSuccess} />

      {/* 右侧：模板列表 */}
      <TemplateList ref={listRef} />
    </div>
  )
}
