import { Hono } from 'hono'
import chromeBrowserManager from '../module/chrome-browser'

const chromeApi = new Hono()
  .get('/auth/status', async (c) => {
    try {
      const status = await chromeBrowserManager.checkLoginStatus()
      return c.json(status)
    } catch (error: any) {
      return c.json({ isLoggedIn: false, error: error.message }, 500)
    }
  })
  .post('/auth/login', async (c) => {
    try {
      const result = await chromeBrowserManager.loginGoogle()
      return c.json(result)
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500)
    }
  })

export default chromeApi
