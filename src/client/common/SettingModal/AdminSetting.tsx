import { forwardRef, useImperativeHandle } from 'react'

export interface AdminSettingRef {
  save: () => Promise<void>
}

export const AdminSetting = forwardRef<AdminSettingRef>((_props, ref) => {
  useImperativeHandle(ref, () => ({
    save: async () => {
      // 预留管理员配置的保存逻辑
    }
  }))

  return <div className="px-4 py-2">{/* 预留管理员配置内容 */}</div>
})
