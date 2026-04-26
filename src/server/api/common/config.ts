import { zValidator } from '@hono/zod-validator'
import { Hono } from 'hono'
import { z } from 'zod'
import { getConfig, updateConfig } from '../../common/config'

const configApi = new Hono()
  .get('/', (c) => {
    return c.json({
      success: true,
      data: getConfig()
    })
  })
  .post(
    '/',
    zValidator(
      'json',
      z.object({
        gptImageApiKey: z.string().nullable().optional()
      })
    ),
    (c) => {
      const body = c.req.valid('json')
      const newConfig = updateConfig(body)
      return c.json({
        success: true,
        data: newConfig
      })
    }
  )

export default configApi
