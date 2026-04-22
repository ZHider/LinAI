import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { handleLogSSE } from './utils'
import { logger } from '../module/utils/logger'

const logApi = new Hono()
  .get(
    '/:moduleId',
    zValidator('param', z.object({ moduleId: z.string() })),
    (c) => handleLogSSE(c, logger)
  )
  .delete(
    '/:moduleId',
    zValidator('param', z.object({ moduleId: z.string() })),
    (c) => {
      logger.clearLogs()
      return c.json({ success: true as const })
    }
  )

export default logApi
