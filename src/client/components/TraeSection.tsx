import { useState, useEffect } from 'react'
import { hc } from 'hono/client'
import {
  Modal,
  Button,
  message,
  Divider,
  List,
  Typography,
  Space,
  Popconfirm,
  Card
} from 'antd'
import {
  CodeOutlined,
  DeleteOutlined,
  CopyOutlined,
  HistoryOutlined
} from '@ant-design/icons'
import type { AppType } from '../../server/index'
import { LogViewer } from './LogViewer'

const { Text } = Typography
const client = hc<AppType>('/')

interface TraeAccount {
  id: string
  email: string
  password: string
  createdAt: string
}

export function TraeSection() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState<TraeAccount[]>([])
  const [newAccount, setNewAccount] = useState<TraeAccount | null>(null)

  useEffect(() => {
    if (isModalOpen) {
      fetchHistory()
    }
  }, [isModalOpen])

  const fetchHistory = async () => {
    try {
      const res = await client.api.trae.history.$get()
      const data = await res.json()
      if (data.success) {
        setHistory(data.data as TraeAccount[])
      }
    } catch (e) {
      console.error(e)
      message.error('获取历史记录失败')
    }
  }

  const showModal = () => {
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setNewAccount(null)
  }

  const handleApplyEmail = async () => {
    setLoading(true)
    setNewAccount(null)
    try {
      const res = await client.api.trae['apply-email'].$post()
      const data = await res.json()
      if (!data.success) {
        message.error('error' in data ? data.error : '申请失败')
      } else {
        message.success('成功触发 Trae 功能')
        if ('data' in data) {
          setNewAccount(data.data as TraeAccount)
          fetchHistory()
        }
      }
    } catch (e) {
      console.error(e)
      message.error('请求申请失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await client.api.trae.history[':id'].$delete({
        param: { id }
      })
      const data = await res.json()
      if (data.success) {
        message.success('删除成功')
        fetchHistory()
      }
    } catch (e) {
      console.error(e)
      message.error('删除失败')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    message.success('已复制到剪贴板')
  }

  return (
    <>
      <div
        className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-md cursor-pointer hover:border-indigo-200"
        onClick={showModal}
      >
        <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <CodeOutlined className="text-xl" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 m-0">Trae</h3>
        </div>

        <div className="p-5 flex-1 flex flex-col gap-4">
          <div className="flex flex-col items-center justify-center py-6 text-center gap-4 bg-slate-50 rounded-xl border border-slate-100 flex-1">
            <div>
              <p className="text-slate-600 font-medium mb-1">
                Trae 账号自动化申请
              </p>
              <p className="text-slate-400 text-sm">点击探索更多</p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        title="Trae 自动化管理"
        open={isModalOpen}
        onCancel={handleCancel}
        footer={null}
        centered
        width={900}
      >
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col items-center justify-center gap-4 bg-indigo-50/30 p-8 rounded-2xl border border-indigo-100">
            <div className="text-center">
              <h4 className="text-lg font-bold text-slate-800 mb-2">
                申请新账号
              </h4>
              <p className="text-slate-500 max-w-md">
                自动使用临时邮箱注册 Trae
                账号，过程全自动化，成功后将显示在下方。
              </p>
            </div>
            <Button
              type="primary"
              onClick={handleApplyEmail}
              loading={loading}
              className="bg-indigo-600 hover:bg-indigo-700 shadow-md px-10 h-12 text-lg"
              shape="round"
            >
              立即申请 Trae 账号
            </Button>

            {newAccount && (
              <Card className="w-full max-w-md mt-4 border-green-200 bg-green-50/20">
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <Text strong className="text-green-700">
                      账号申请成功！
                    </Text>
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-green-100">
                    <div className="flex flex-col">
                      <Text type="secondary">邮箱</Text>
                      <Text strong>{newAccount.email}</Text>
                    </div>
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(newAccount.email)}
                    />
                  </div>
                  <div className="flex justify-between items-center bg-white p-2 rounded border border-green-100">
                    <div className="flex flex-col">
                      <Text type="secondary">密码</Text>
                      <Text strong>{newAccount.password}</Text>
                    </div>
                    <Button
                      type="text"
                      icon={<CopyOutlined />}
                      onClick={() => copyToClipboard(newAccount.password)}
                    />
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <HistoryOutlined />
                <span>历史账号记录</span>
              </div>
              <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                <List
                  className="max-h-[400px] overflow-y-auto"
                  dataSource={history}
                  locale={{ emptyText: '暂无历史记录' }}
                  renderItem={(item) => (
                    <List.Item
                      key={item.id}
                      className="px-4 hover:bg-white transition-colors border-b border-slate-100"
                      actions={[
                        <Popconfirm
                          title="确定删除此账号记录吗？"
                          onConfirm={() => handleDelete(item.id)}
                          okText="确定"
                          cancelText="取消"
                        >
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                          />
                        </Popconfirm>
                      ]}
                    >
                      <List.Item.Meta
                        title={
                          <Space>
                            <Text strong className="text-slate-700">
                              {item.email}
                            </Text>
                            <Button
                              type="text"
                              size="small"
                              icon={<CopyOutlined className="text-xs" />}
                              onClick={() => copyToClipboard(item.email)}
                            />
                          </Space>
                        }
                        description={
                          <div className="flex flex-col gap-1">
                            <Space>
                              <Text type="secondary">
                                密码: {item.password}
                              </Text>
                              <Button
                                type="text"
                                size="small"
                                icon={
                                  <CopyOutlined className="text-xs text-slate-400" />
                                }
                                onClick={() => copyToClipboard(item.password)}
                              />
                            </Space>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              创建时间:{' '}
                              {new Date(item.createdAt).toLocaleString()}
                            </Text>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 text-slate-700 font-bold">
                <CodeOutlined />
                <span>自动化日志</span>
              </div>
              <div className="h-[400px] rounded-xl border border-slate-200 overflow-hidden bg-slate-900">
                <LogViewer moduleId="trae" title="" />
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
