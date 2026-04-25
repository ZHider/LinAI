import { Button, Switch, Space, Modal, message } from 'antd'
import {
  SyncOutlined,
  DownloadOutlined,
  DeleteOutlined,
  BellOutlined
} from '@ant-design/icons'
import { useLocalStorageState } from 'ahooks'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { hc } from 'hono/client'
import type { AppType } from '../../../server'
import type { Task } from '../../../server/common/task-manager'
import { ScheduleOutlined } from '@ant-design/icons'
import { useState, useEffect, useRef } from 'react'

const client = hc<AppType>('/')

interface TaskListHeaderProps {
  tasks: Task[]
  downloadedIds: string[]
  setDownloadedIds: (ids: string[]) => void
  fetchTasks: () => void
  loading: boolean
}

export function TaskListHeader({
  tasks,
  downloadedIds,
  setDownloadedIds,
  fetchTasks,
  loading
}: TaskListHeaderProps) {
  const [notifyEnabled, setNotifyEnabled] = useLocalStorageState(
    'taskCompletionNotification',
    { defaultValue: false }
  )
  const [downloading, setDownloading] = useState(false)
  const [deletingErrors, setDeletingErrors] = useState(false)
  const [deletingDownloaded, setDeletingDownloaded] = useState(false)

  const handleNotifyChange = (checked: boolean) => {
    if (checked && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    setNotifyEnabled(checked)
  }

  // 通知逻辑
  const prevTasksRef = useRef<Task[]>([])
  useEffect(() => {
    if (!notifyEnabled) {
      prevTasksRef.current = tasks
      return
    }

    const prevTasks = prevTasksRef.current
    if (prevTasks.length > 0) {
      const completedTasks = tasks.filter((t) => {
        const prev = prevTasks.find((pt) => pt.id === t.id)
        return t.status === 'completed' && prev && prev.status !== 'completed'
      })

      if (completedTasks.length > 0 && Notification.permission === 'granted') {
        const title =
          completedTasks.length === 1
            ? `任务完成: ${completedTasks[0].rawTemplate?.title || '未命名任务'}`
            : `有 ${completedTasks.length} 个任务已完成`
        new Notification(title, {
          body: '请在任务列表查看详情',
          icon: completedTasks[0].outputUrl || undefined
        })
      }
    }

    prevTasksRef.current = tasks
  }, [tasks, notifyEnabled])

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

  const handleDeleteErrors = async () => {
    const errorTasks = tasks.filter((t) => t.status === 'failed')
    if (errorTasks.length === 0) {
      message.info('没有错误任务')
      return
    }

    setDeletingErrors(true)
    try {
      let successCount = 0
      await Promise.all(
        errorTasks.map(async (task) => {
          try {
            const res = await client.api.task[':id'].$delete({
              param: { id: task.id }
            })
            const json = await res.json()
            if (json.success) successCount++
          } catch (e) {
            // ignore individual errors
          }
        })
      )
      message.success(`成功删除 ${successCount} 个错误任务`)
      fetchTasks()
    } catch (error) {
      message.error('删除错误任务失败')
    } finally {
      setDeletingErrors(false)
    }
  }

  const handleDeleteDownloaded = () => {
    const toDelete = tasks.filter((t) => downloadedIds.includes(t.id))
    if (toDelete.length === 0) {
      message.info('没有已下载的任务')
      return
    }

    Modal.confirm({
      title: '确认删除所有已下载任务？',
      content: (
        <div>
          <p className="text-red-500 font-bold mb-2">
            警告：将删除源文件且无法找回！
          </p>
          <p>请确保您已妥善保存好下载的图片/视频。</p>
          <p>共将删除 {toDelete.length} 个任务。</p>
        </div>
      ),
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setDeletingDownloaded(true)
        try {
          let successCount = 0
          await Promise.all(
            toDelete.map(async (task) => {
              try {
                const res = await client.api.task[':id'].$delete({
                  param: { id: task.id }
                })
                const json = await res.json()
                if (json.success) successCount++
              } catch (e) {
                // ignore individual errors
              }
            })
          )
          message.success(`成功删除 ${successCount} 个已下载任务`)
          fetchTasks()
        } catch (error) {
          message.error('批量删除失败')
        } finally {
          setDeletingDownloaded(false)
        }
      }
    })
  }

  return (
    <div className="flex items-center justify-between mt-4 mb-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600 flex items-center justify-center">
            <ScheduleOutlined className="text-xl" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight m-0">
            任务列表
          </h2>
        </div>

        <Space className="ml-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              <BellOutlined /> 完成后弹出提醒
            </span>
            <Switch
              checked={notifyEnabled}
              onChange={handleNotifyChange}
              size="small"
            />
          </div>

          <Button
            icon={<DownloadOutlined />}
            onClick={handleDownloadAll}
            loading={downloading}
          >
            下载所有未下载
          </Button>

          <Button
            icon={<DeleteOutlined />}
            onClick={handleDeleteErrors}
            loading={deletingErrors}
            danger
          >
            删除所有错误任务
          </Button>

          <Button
            icon={<DeleteOutlined />}
            onClick={handleDeleteDownloaded}
            loading={deletingDownloaded}
            danger
          >
            删除所有已下载任务
          </Button>
        </Space>
      </div>

      <Button icon={<SyncOutlined />} onClick={fetchTasks} loading={loading}>
        刷新
      </Button>
    </div>
  )
}
