import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { TaskManager } from '../../common/task-manager'

export const taskManager = new TaskManager()
const taskApi = new Hono()
  // Chain route declarations so Hono keeps the full client route map in AppType.
  .get('/', async (c) => {
    try {
      const tasks = await taskManager.getTasks()
      return c.json({ success: true as const, data: tasks })
    } catch (error: any) {
      return c.json({ success: false as const, error: error.message }, 500)
    }
  })
  .delete(
    '/:id',
    zValidator('param', z.object({ id: z.string() })),
    async (c) => {
      try {
        const { id } = c.req.valid('param')
        const result = await taskManager.deleteTask(id)
        if (!result.success) {
          return c.json(
            {
              success: false as const,
              error: result.error || 'Failed to delete task'
            },
            404
          )
        }
        return c.json({ success: true as const })
      } catch (error: any) {
        return c.json({ success: false as const, error: error.message }, 500)
      }
    }
  )

export default taskApi
