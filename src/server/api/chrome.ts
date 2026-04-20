import { Hono } from 'hono'
import chromeBrowserManager from '../module/chrome-browser'

const chromeApi = new Hono().post('/auth/login', async (c) => {
  try {
    const result = await chromeBrowserManager.loginGoogle()
    return c.json(result)
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default chromeApi
