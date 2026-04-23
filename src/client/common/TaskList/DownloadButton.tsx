import { Button, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'

export const DownloadButton = ({
  outputUrl,
  fileName,
  onDownloaded
}: {
  outputUrl: string
  fileName: string
  onDownloaded: () => void
}) => {
  const handleDownload = async () => {
    try {
      const res = await fetch(outputUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = outputUrl.split('.').pop() || 'png'
      a.download = `${fileName}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      onDownloaded()
      message.success('开始下载')
    } catch (err) {
      message.error('下载失败')
    }
  }

  return (
    <Button
      type="text"
      icon={<DownloadOutlined />}
      onClick={() => handleDownload()}
    />
  )
}
