import { useState } from 'react'
import { hc } from 'hono/client'
import { message, Button } from 'antd'
import { GoogleOutlined } from '@ant-design/icons'
import type { AppType } from '../../server/index'

const client = hc<AppType>('/')

export function GeminiSection() {
  const [loading, setLoading] = useState(false)

  const handleOpenGemini = async () => {
    setLoading(true)
    try {
      const res = await client.api.gemini.open.$post()
      const data = await res.json()
      if (data.success) {
        message.success('成功打开 Gemini 官网')
      } else {
        message.error(data.error || '打开失败')
      }
    } catch (e) {
      console.error(e)
      message.error('请求失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col transition-all hover:shadow-md cursor-pointer hover:border-blue-200"
      onClick={handleOpenGemini}
    >
      <div className="p-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
        <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
          <GoogleOutlined className="text-xl" />
        </div>
        <h3 className="text-lg font-bold text-slate-800 m-0">Gemini</h3>
      </div>

      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex flex-col items-center justify-center py-6 text-center gap-4 bg-slate-50 rounded-xl border border-slate-100 flex-1">
          <div>
            <p className="text-slate-600 font-medium mb-1">Gemini AI</p>
            <p className="text-slate-400 text-sm">点击打开官网进行对话</p>
          </div>
          <Button
            type="primary"
            loading={loading}
            className="bg-blue-600 hover:bg-blue-700 shadow-sm px-6"
            shape="round"
          >
            立即打开
          </Button>
        </div>
      </div>
    </div>
  )
}
