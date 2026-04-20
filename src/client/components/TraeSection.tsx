import { useState, useEffect } from 'react'
import { hc } from 'hono/client'
import { Modal, Button, message, Divider, Typography, Card, Input } from 'antd'
import { CodeOutlined, CopyOutlined, MailOutlined } from '@ant-design/icons'
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
  const [newAccount, setNewAccount] = useState<TraeAccount | null>(null)
  const [baseEmail, setBaseEmail] = useState('')
  const [inputEmail, setInputEmail] = useState('')

  // Google 登录状态
  const [isGoogleLoggedIn, setIsGoogleLoggedIn] = useState(false)
  const [googleAccountInfo, setGoogleAccountInfo] = useState<{
    email?: string
  } | null>(null)
  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => {
    if (isModalOpen) {
      fetchBaseEmail()
    }
  }, [isModalOpen])

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      setLoggingIn(true)
      const res = await client.api.chrome.auth.login.$post()
      const data = await res.json()
      if (data.success) {
        message.success('登录成功')
        setIsGoogleLoggedIn(true)
        if (data.email) {
          setGoogleAccountInfo({ email: data.email as string })
        }
      } else {
        message.error(data.error || '登录失败')
      }
    } catch (e) {
      console.error(e)
      message.error('请求登录失败')
    } finally {
      setLoggingIn(false)
    }
  }

  const fetchBaseEmail = async () => {
    try {
      const res = await client.api.trae['base-email'].$get()
      const data = await res.json()
      if (data.success) {
        setBaseEmail(data.data)
        setInputEmail(data.data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleSaveBaseEmail = async () => {
    try {
      const res = await client.api.trae['base-email'].$post({
        json: { email: inputEmail }
      })
      const data = await res.json()
      if (data.success) {
        message.success('基础邮箱保存成功')
        setBaseEmail(inputEmail)
      } else {
        message.error('保存失败')
      }
    } catch (e) {
      console.error(e)
      message.error('保存失败')
    }
  }

  const getAliases = () => {
    if (!baseEmail || !baseEmail.includes('@')) return []
    const [name, domain] = baseEmail.split('@')
    return [
      `${name}+trae01@${domain}`,
      `${name}+trae02@${domain}`,
      `${name}+trae03@${domain}`
    ]
  }

  const showModal = () => {
    if (!isGoogleLoggedIn) {
      message.warning('请先登录 Google 账号')
      return
    }
    setIsModalOpen(true)
  }

  const handleCancel = () => {
    setIsModalOpen(false)
    setNewAccount(null)
  }

  const handleApplyEmail = async (email: string) => {
    setLoading(true)
    setNewAccount(null)
    try {
      const res = await client.api.trae['apply-email'].$post({
        json: { email }
      })
      const data = await res.json()
      if (!data.success) {
        message.error('error' in data ? data.error : '申请失败')
      } else {
        message.success('成功触发 Trae 功能')
        if ('data' in data) {
          setNewAccount(data.data as TraeAccount)
        }
      }
    } catch (e) {
      console.error(e)
      message.error('请求申请失败')
    } finally {
      setLoading(false)
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
            {!isGoogleLoggedIn ? (
              <>
                <div className="w-12 h-12 bg-slate-200/50 rounded-full flex items-center justify-center text-slate-400">
                  <MailOutlined className="text-xl" />
                </div>
                <div>
                  <p className="text-slate-600 font-medium mb-1">
                    未登录 Google
                  </p>
                  <p className="text-slate-400 text-sm">
                    点击进行浏览器环境授权登录
                  </p>
                </div>
                <Button
                  type="primary"
                  onClick={handleGoogleLogin}
                  loading={loggingIn}
                  className="mt-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm px-8"
                  shape="round"
                >
                  去登录
                </Button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                  <CodeOutlined className="text-xl" />
                </div>
                <div>
                  <p className="text-slate-600 font-medium mb-1">
                    Trae 账号自动化申请
                  </p>
                  <p className="text-slate-400 text-sm">点击探索更多</p>
                </div>
                {googleAccountInfo && googleAccountInfo.email && (
                  <div className="mt-2 px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-100">
                    已登录: {googleAccountInfo.email}
                  </div>
                )}
              </>
            )}
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
            <div className="text-center w-full max-w-md">
              <h4 className="text-lg font-bold text-slate-800 mb-2">
                申请新账号
              </h4>
              <p className="text-slate-500 mb-4">
                使用 Gmail 别名自动注册 Trae 账号，需在系统浏览器已登录对应
                Gmail。
              </p>

              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="请输入您的 Gmail 基础邮箱"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  prefix={<MailOutlined className="text-slate-400" />}
                />
                <Button type="primary" onClick={handleSaveBaseEmail}>
                  保存
                </Button>
              </div>

              {baseEmail && baseEmail.includes('@') && (
                <div className="flex flex-col gap-3">
                  <Text type="secondary" className="text-left">
                    选择以下别名开始申请：
                  </Text>
                  {getAliases().map((alias) => (
                    <Button
                      key={alias}
                      onClick={() => handleApplyEmail(alias)}
                      loading={loading}
                      className="w-full text-left flex justify-between items-center h-10"
                    >
                      <span>{alias}</span>
                      <span className="text-indigo-500 text-xs bg-indigo-50 px-2 py-1 rounded">
                        使用此别名
                      </span>
                    </Button>
                  ))}

                  <Divider className="my-2" />
                  <div className="flex gap-2">
                    <Input
                      placeholder="或输入自定义别名邮箱"
                      id="customAlias"
                    />
                    <Button
                      onClick={() => {
                        const val = (
                          document.getElementById(
                            'customAlias'
                          ) as HTMLInputElement
                        )?.value
                        if (val) handleApplyEmail(val)
                      }}
                      loading={loading}
                    >
                      申请
                    </Button>
                  </div>
                </div>
              )}
            </div>

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
      </Modal>
    </>
  )
}
