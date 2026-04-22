import { Hono } from 'hono'
import fs from 'fs-extra'
import path from 'path'
import { TaskManager } from '../module/task-manager'

export const taskManager = new TaskManager()
const taskApi = new Hono()

// Serve uploaded images (for backward compatibility or task images)
taskApi.get('/images/:filename', async (c) => {
  const filename = c.req.param('filename')
  const filepath = path.join(process.cwd(), 'data', 'images', filename)
  if (fs.existsSync(filepath)) {
    const file = await fs.readFile(filepath)
    const ext = path.extname(filename).slice(1)
    c.header('Content-Type', `image/${ext === 'jpg' ? 'jpeg' : ext}`)
    return c.body(file)
  }
  return c.notFound()
})

export default taskApi
