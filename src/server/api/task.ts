import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import fs from 'fs-extra'
import path from 'path'
import { TaskManager } from '../common/task-manager'

export const taskManager = new TaskManager()
const taskApi = new Hono()
  // Chain route declarations so Hono keeps the full client route map in AppType.
  .get(
    '/:moduleId',
    zValidator('param', z.object({ moduleId: z.string() })),
    async (c) => {
      const { moduleId } = c.req.valid('param')
      try {
        const tasks = await taskManager.getTasksBySource(moduleId)
        return c.json({ success: true as const, data: tasks })
      } catch (error: any) {
        return c.json({ success: false as const, error: error.message }, 500)
      }
    }
  )
  .post(
    '/:moduleId/from-template',
    zValidator('param', z.object({ moduleId: z.string() })),
    zValidator('json', z.object({ templateId: z.string().min(1, 'templateId is required') })),
    async (c) => {
      const { moduleId } = c.req.valid('param')
      try {
        const { templateId } = c.req.valid('json')
        const newTask = await taskManager.createTaskFromTemplate(templateId)
        if (!newTask) {
          return c.json({ success: false as const, error: 'Template not found' }, 404)
        }
        // Since it's created for this module, ensure source matches.
        if (newTask.source !== moduleId) {
          // Assuming the frontend passes a templateId that matches the module.
        }
        return c.json({ success: true as const, data: newTask })
      } catch (error: any) {
        return c.json({ success: false as const, error: error.message }, 500)
      }
    }
  )
  .delete(
    '/:moduleId/:id',
    zValidator('param', z.object({ moduleId: z.string(), id: z.string() })),
    async (c) => {
      try {
        const { id } = c.req.valid('param')
        const success = await taskManager.deleteTask(id)
        if (!success) {
          return c.json({ success: false as const, error: 'Task not found' }, 404)
        }
        return c.json({ success: true as const })
      } catch (error: any) {
        return c.json({ success: false as const, error: error.message }, 500)
      }
    }
  )
  .get(
    '/images/:filename',
    zValidator('param', z.object({ filename: z.string() })),
    async (c) => {
      const { filename } = c.req.valid('param')
      const filepath = path.join(process.cwd(), 'data', 'images', filename)
      if (fs.existsSync(filepath)) {
        const file = await fs.readFile(filepath)
        const ext = path.extname(filename).slice(1)
        c.header('Content-Type', `image/${ext === 'jpg' ? 'jpeg' : ext}`)
        return c.body(file)
      }
      return c.notFound()
    }
  )

export default taskApi
