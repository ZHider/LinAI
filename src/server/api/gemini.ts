import { Hono } from 'hono'
import { geminiManager } from '../module/gemini-manager/index'

const geminiApi = new Hono().post('/open', async (c) => {
  try {
    const result = await geminiManager.openGemini()
    if (result.success) {
      return c.json({ success: true })
    } else {
      return c.json({ success: false, error: result.error }, 500)
    }
  } catch (error: any) {
    return c.json({ success: false, error: error.message }, 500)
  }
})

export default geminiApi
