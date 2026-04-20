import { Hono } from 'hono'
import { TraeManager } from '../module/trae-manager/index'
import { TraeStorage } from '../module/trae-manager/storage'
import { bindLogRoutes } from './utils'

const traeManager = new TraeManager()

const traeApi = new Hono()
  .get('/alias-records', async (c) => {
    try {
      const records = await TraeStorage.getAliasRecords()
      return c.json({ success: true, data: records })
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
      if (result.success) {
        await TraeStorage.recordAliasApplyTime(email, new Date().toISOString())
      }
      return c.json(result)
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500)
    }
  })

bindLogRoutes(traeApi, traeManager.logger)

export default traeApi
