import { Hono } from 'hono'
import { TraeManager } from '../trae-manager/index'
import { TraeStorage } from '../trae-manager/storage'
import { bindLogRoutes } from './utils'

const traeManager = new TraeManager()

const traeApi = new Hono()
  .get('/auth/status', async (c) => {
    try {
      const status = await traeManager.checkLoginStatus()
      return c.json(status)
    } catch (error: any) {
      return c.json({ isLoggedIn: false, error: error.message }, 500)
    }
  })
  .post('/auth/login', async (c) => {
    try {
      const result = await traeManager.loginGoogle()
      return c.json(result)
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500)
    }
  })
  .get('/base-email', async (c) => {
    try {
      const email = await TraeStorage.getBaseEmail()
      return c.json({ success: true, data: email })
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500)
    }
  })
  .post('/base-email', async (c) => {
    try {
      const { email } = await c.req.json()
      await TraeStorage.setBaseEmail(email || '')
      return c.json({ success: true })
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500)
    }
  })
  .post('/apply-email', async (c) => {
    try {
      const { email } = await c.req.json()
      if (!email) {
        return c.json({ success: false, error: 'Email is required' }, 400)
      }
      const result = await traeManager.applyEmail(email)
      return c.json(result)
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500)
    }
  })

bindLogRoutes(traeApi, traeManager.logger)

export default traeApi
