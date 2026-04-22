import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { templateManager } from './template'
import { logger } from '../module/utils/logger'

const gptImageApi = new Hono().post(
  '/generate',
  zValidator(
    'json',
    z.object({
      apiKey: z.string().min(1, 'API Key is required'),
      templateId: z.string().min(1, 'Template ID is required')
    })
  ),
  async (c) => {
    try {
      const { apiKey, templateId } = c.req.valid('json')

      const templates = await templateManager.getTemplates()
      const template = templates.find((t) => t.id === templateId)

      if (!template) {
        return c.json({ success: false, error: 'Template not found' }, 404)
      }

      logger.info('Generating GPT image for template ' + templateId)

      const response = await fetch('https://ai.t8star.cn/v1/images/generations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-image-2',
          prompt: template.prompt
        })
      })

      if (!response.ok) {
        const errorData = await response.text()
        logger.error('Failed to generate GPT image', errorData)
        return c.json({ success: false, error: `API error: ${response.status} ${errorData}` }, 500)
      }

      const data = await response.json()
      
      const imageResult = data.data?.[0]
      if (!imageResult) {
        throw new Error('No image returned from API')
      }

      const imageUrl = imageResult.url || `data:image/png;base64,${imageResult.b64_json}`

      logger.info('GPT image generated successfully')
      return c.json({ success: true, image: imageUrl })

    } catch (error: any) {
      logger.error('Failed to generate GPT image', error.message)
      return c.json({ success: false, error: error.message }, 500)
    }
  }
)

export default gptImageApi