import { createRoot } from 'react-dom/client'
import { Image, Modal, Tabs, message } from 'antd'
import QRCodeImg from '../../assets/image/qrcode.jpg'

export function openNotificationModal() {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)

  function destroy() {
    root.unmount()
    if (container.parentNode) {
      container.parentNode.removeChild(container)
    }
  }

  function ModalComponent() {
    const items = [
      {
        key: 'important',
        label: '📢 重要说明',
        children: (
          <div className="py-4 px-2 text-base text-gray-700">
            <div className="space-y-3 mb-6">
              <div className="flex items-start">
                <span className="mr-3 text-xl">🛡️</span>
                <div className="leading-relaxed">
                  <span className="font-bold text-gray-900">数据隐私：</span>
                  本工具后端在用户本地运行，本工具本身无任何第三方数据收集。仅在您使用开发者分享的
                  API Key 时，开发者能在 API
                  平台查看基本开销日志，不包含提示词或上传的图片等隐私内容。
                </div>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-xl">⚠️</span>
                <div className="leading-relaxed">
                  <span className="font-bold text-gray-900">充值建议：</span>
                  本工具对接第三方平台服务，存在不可控因素。为保障您的资金安全，建议单次充值金额不要超过
                  10 元，单张 2k medium 仅 0.04 元左右，日常使用额度完全够用。
                </div>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-xl">🔄</span>
                <div className="leading-relaxed">
                  <span className="font-bold text-gray-900">快速升级：</span>
                  将新版本压缩包直接拖放至“版本迁移”批处理（.bat）脚本上，即可保留用户数据的同事自动完成版本升级。
                </div>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-xl">💬</span>
                <div className="leading-relaxed">
                  <span className="font-bold text-gray-900">工具交流群：</span>
                  <span
                    className="cursor-pointer text-blue-500 hover:text-blue-600 underline font-medium"
                    onClick={() => {
                      navigator.clipboard.writeText('1098503823')
                      message.success('群号已复制')
                    }}
                  >
                    1098503823
                  </span>
                  <span className="text-gray-400 text-sm ml-2 select-none">
                    (点击复制)
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center">
              <div className="text-gray-600 mb-1 text-lg">
                ☕ 感谢赞助支持，可以备注你的昵称
              </div>
              <div className="flex items-center justify-center">
                <Image src={QRCodeImg} alt="赞助二维码" width={200} />
              </div>
            </div>
          </div>
        )
      },
      {
        key: 'tips',
        label: '💡 使用技巧',
        children: (
          <div className="py-4 px-2 text-base text-gray-700">
            <div className="space-y-5">
              <div className="flex items-start">
                <span className="mr-3 text-xl">🎨</span>
                <div className="leading-relaxed">
                  <span className="font-bold text-gray-900">提示词技巧：</span>
                  部分模型的文字审查机制较为严格（如 GPT Image
                  2），建议优先采用“上传图片作为参考”的方式进行生成，以提高成功率。
                </div>
              </div>
              <div className="flex items-start">
                <span className="mr-3 text-xl">📦</span>
                <div className="leading-relaxed">
                  <span className="font-bold text-gray-900">存储优化：</span>
                  为节省磁盘空间，上传的图片在本地存储时将自动压缩为 WebP
                  格式。您可以在系统设置中对此功能进行个性化配置。
                </div>
              </div>
            </div>
          </div>
        )
      },
      {
        key: 'errors',
        label: '🚨 错误提示',
        children: (
          <div className="py-4 px-2 text-base">
            <div className="bg-red-50 p-5 rounded-lg border border-red-100 flex items-start">
              <span className="mr-3 text-2xl">⚠️</span>
              <div className="text-red-800 leading-relaxed">
                API
                中转服务偶遇网络波动或请求拥堵时可能会出现报错。请仔细阅读具体报错信息，若因访问量过大导致，稍等片刻后重试即可恢复。
              </div>
            </div>
          </div>
        )
      }
    ]

    return (
      <Modal
        title={
          <span className="text-xl font-semibold flex items-center gap-2">
            <span>🔔</span> 通知与说明
          </span>
        }
        open={true}
        onCancel={destroy}
        footer={null}
        destroyOnClose
        width={650}
      >
        <div className="pt-2 min-h-[350px]">
          <Tabs items={items} defaultActiveKey="important" size="large" />
        </div>
      </Modal>
    )
  }

  root.render(<ModalComponent />)
}
