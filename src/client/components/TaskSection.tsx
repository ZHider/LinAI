import { useState, useEffect } from 'react'
import { ScheduleOutlined, InboxOutlined, DeleteOutlined, PlusOutlined, UploadOutlined } from '@ant-design/icons'
import { Form, Input, Radio, Select, Button, Card, message, Upload, Spin, Tag, Space, Popconfirm } from 'antd'

interface TaskTemplate {
  id: string
  type: 'image' | 'video'
  image: string
  prompt: string
  quality: string
  aspectRatio: string
  createdAt: number
}

export function TaskSection() {
  const [form] = Form.useForm()
  const [templates, setTemplates] = useState<TaskTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>('')

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/task/templates')
      const json = await res.json()
      if (json.success) {
        setTemplates(json.data)
      } else {
        message.error(json.error || '获取模板失败')
      }
    } catch (error) {
      message.error('请求失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleFinish = async (values: any) => {
    if (!imageUrl) {
      message.warning('请上传图片')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        ...values,
        image: imageUrl
      }

      const res = await fetch('/api/task/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const json = await res.json()
      
      if (json.success) {
        message.success('保存成功')
        form.resetFields()
        setImageUrl('')
        fetchTemplates()
      } else {
        message.error(json.error || '保存失败')
      }
    } catch (error) {
      message.error('请求失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/task/templates/${id}`, {
        method: 'DELETE'
      })
      const json = await res.json()
      if (json.success) {
        message.success('删除成功')
        fetchTemplates()
      } else {
        message.error(json.error || '删除失败')
      }
    } catch (error) {
      message.error('请求失败')
    }
  }

  const handleUpload = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      setImageUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    return false // 阻止默认上传行为
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600 flex items-center justify-center">
          <ScheduleOutlined className="text-xl" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          任务编排
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 左侧：表单 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <PlusOutlined className="text-emerald-500" /> 新增模板
          </h3>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={{ type: 'image', quality: '1080p', aspectRatio: '16:9' }}
          >
            <Form.Item name="type" label="任务类型" rules={[{ required: true }]}>
              <Radio.Group optionType="button" buttonStyle="solid">
                <Radio.Button value="image">图片</Radio.Button>
                <Radio.Button value="video">视频</Radio.Button>
              </Radio.Group>
            </Form.Item>

            <Form.Item label="上传图片" required>
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleUpload}
              >
                <Button icon={<UploadOutlined />}>选择图片</Button>
              </Upload>
              {imageUrl && (
                <div className="mt-4 rounded-lg overflow-hidden border border-slate-200" style={{ width: '120px', height: '120px' }}>
                  <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
                </div>
              )}
            </Form.Item>

            <Form.Item name="prompt" label="提示词" rules={[{ required: true, message: '请填写提示词' }]}>
              <Input.TextArea rows={4} placeholder="请输入生成内容的提示词..." />
            </Form.Item>

            <div className="flex gap-4">
              <Form.Item name="quality" label="画质" className="flex-1" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="720p">720p</Select.Option>
                  <Select.Option value="1080p">1080p</Select.Option>
                  <Select.Option value="2k">2K</Select.Option>
                  <Select.Option value="4k">4K</Select.Option>
                </Select>
              </Form.Item>

              <Form.Item name="aspectRatio" label="图片比例" className="flex-1" rules={[{ required: true }]}>
                <Select>
                  <Select.Option value="16:9">16:9 (横屏)</Select.Option>
                  <Select.Option value="9:16">9:16 (竖屏)</Select.Option>
                  <Select.Option value="1:1">1:1 (正方形)</Select.Option>
                  <Select.Option value="4:3">4:3</Select.Option>
                </Select>
              </Form.Item>
            </div>

            <Form.Item className="mb-0 pt-4 border-t border-slate-100">
              <Button type="primary" htmlType="submit" loading={submitting} block size="large" className="bg-emerald-600 hover:bg-emerald-700">
                保存模板
              </Button>
            </Form.Item>
          </Form>
        </div>

        {/* 右侧：模板列表 */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">已有模板 ({templates.length})</h3>
          
          <div className="flex-1 overflow-y-auto pr-2" style={{ maxHeight: '600px' }}>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Spin />
              </div>
            ) : templates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/50">
                <InboxOutlined className="text-5xl text-slate-300" />
                <p className="text-sm font-medium">暂无模板内容</p>
              </div>
            ) : (
              <div className="space-y-4">
                {templates.map(item => (
                  <Card key={item.id} size="small" className="shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      <div className="w-24 h-24 shrink-0 rounded-md overflow-hidden bg-slate-100 border border-slate-200">
                        <img src={item.image} alt="template" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex justify-between items-start mb-2">
                          <Space size={[0, 4]} wrap>
                            <Tag color={item.type === 'image' ? 'blue' : 'purple'}>
                              {item.type === 'image' ? '图片' : '视频'}
                            </Tag>
                            <Tag color="green">{item.quality}</Tag>
                            <Tag color="orange">{item.aspectRatio}</Tag>
                          </Space>
                          <Popconfirm
                            title="确定要删除该模板吗？"
                            onConfirm={() => handleDelete(item.id)}
                            okText="确定"
                            cancelText="取消"
                            okButtonProps={{ danger: true }}
                          >
                            <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                          </Popconfirm>
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2 mt-1" title={item.prompt}>
                          {item.prompt}
                        </p>
                        <div className="mt-auto text-xs text-slate-400">
                          {new Date(item.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
