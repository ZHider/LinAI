import { Modal } from 'antd'

interface WanModalProps {
  open: boolean
  onClose: () => void
}

export function WanModal({ open, onClose }: WanModalProps) {
  return (
    <Modal
      title="Wan 视频下载详情"
      open={open}
      onCancel={onClose}
      footer={null}
      destroyOnClose
    >
      {/* 暂时为空 */}
      <div className="py-8 text-center text-slate-500">
        内容加载中...
      </div>
    </Modal>
  )
}
