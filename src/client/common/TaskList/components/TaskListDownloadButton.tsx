import { Button, message } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import { useState } from 'react'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { Task } from '../../../../server/common/task-manager'

interface TaskListDownloadButtonProps {
  tasks: Task[]
  downloadedIds: string[]
  setDownloadedIds: (ids: string[]) => void
}

export function TaskListDownloadButton({
  tasks,
  downloadedIds,
  setDownloadedIds
}: TaskListDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false)

  const handleDownloadAll = async () => {
    const unDownloadedTasks = tasks.filter(
      (t) =>
        t.status === 'completed' && t.outputUrl && !downloadedIds.includes(t.id)
    )

    if (unDownloadedTasks.length === 0) {
      message.info('没有需要下载的任务')
      return
    }

    setDownloading(true)
    try {
      if (unDownloadedTasks.length > 3) {
        message.loading({ content: '正在打包压缩...', key: 'download' })
        const zip = new JSZip()

        await Promise.all(
          unDownloadedTasks.map(async (task, index) => {
            if (!task.outputUrl) return
            try {
              const response = await fetch(task.outputUrl)
              const blob = await response.blob()
              // 获取文件后缀名
              const ext = task.outputUrl.split('.').pop() || 'png'
              const title =
                task.rawTemplate?.title ||
                task.rawTemplate?.prompt ||
                `task_${task.id}`
              // 清理文件名中不合法的字符
              const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 50)
              zip.file(`${safeTitle}_${index}.${ext}`, blob)
            } catch (error) {
              console.error(`下载任务 ${task.id} 失败`, error)
            }
          })
        )

        const content = await zip.generateAsync({ type: 'blob' })
        saveAs(content, `tasks_${new Date().getTime()}.zip`)
        message.success({ content: '打包下载完成', key: 'download' })
      } else {
        message.loading({ content: '正在下载...', key: 'download' })
        await Promise.all(
          unDownloadedTasks.map(async (task) => {
            if (!task.outputUrl) return
            try {
              const response = await fetch(task.outputUrl)
              const blob = await response.blob()
              const ext = task.outputUrl.split('.').pop() || 'png'
              const title =
                task.rawTemplate?.title ||
                task.rawTemplate?.prompt ||
                `task_${task.id}`
              const safeTitle = title.replace(/[\\/:*?"<>|]/g, '_').slice(0, 50)
              saveAs(blob, `${safeTitle}.${ext}`)
            } catch (error) {
              console.error(`下载任务 ${task.id} 失败`, error)
            }
          })
        )
        message.success({ content: '下载完成', key: 'download' })
      }

      // 标记为已下载
      setDownloadedIds([
        ...downloadedIds,
        ...unDownloadedTasks.map((t) => t.id)
      ])
    } catch (error) {
      message.error({ content: '下载失败', key: 'download' })
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Button
      icon={<DownloadOutlined />}
      onClick={handleDownloadAll}
      loading={downloading}
    >
      所有未下载
    </Button>
  )
}
