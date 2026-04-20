import { BrowserContext, Browser } from 'playwright'
import { Logger } from '../utils/logger'
import { v4 as uuidv4 } from 'uuid'
import chromeBrowserManager from '../chrome-browser'

export class TraeManager {
  public logger: Logger

  constructor() {
    this.logger = new Logger('trae')
  }

  private generateRandomPassword(length: number = 12): string {
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+'
    let retVal = ''
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n))
    }
    return retVal
  }

  async applyEmail(email: string) {
    let browser: Browser | null = null
    let context: BrowserContext | null = null
    try {
      this.logger.info(`--- 开始申请 Trae 账号，使用邮箱: ${email} ---`)

      const password = this.generateRandomPassword()

      this.logger.info('启动浏览器并加载账号状态...')
      try {
        const authData = await chromeBrowserManager.getAuthenticatedContext()
        browser = authData.browser
        context = authData.context
      } catch (e: any) {
        this.logger.error('启动浏览器失败:', e.message)
        throw e
      }

      // 1. 访问 Trae 注册页面
      const traePage =
        context.pages().length > 0
          ? context.pages()[0]
          : await context.newPage()
      this.logger.info('访问 Trae 注册页面...')
      await traePage.goto('https://www.trae.ai/sign-up')

      this.logger.info('填写邮箱和密码...')
      await traePage.fill('input[type="email"]', email)
      await traePage.fill('input[type="password"]', password)

      this.logger.info('点击发送验证码...')
      const sendCodeButton = traePage
        .getByRole('button', { name: /Send|Continue|Sign up/i })
        .first()
      await sendCodeButton.click()

      // 2. 访问 Gmail
      this.logger.info('访问 Gmail 获取验证码...')
      const gmailPage = await context.newPage()
      await gmailPage.goto('https://mail.google.com/mail/u/0/#inbox')
      await gmailPage.waitForLoadState('networkidle')

      this.logger.info('等待并查找包含 "Trae" 的最新邮件...')
      let code: string | null = null
      for (let i = 0; i < 6; i++) {
        // Gmail 中通常未读邮件会加粗，可以搜索包含 Trae 的行
        const emailRow = gmailPage.locator('tr:has-text("Trae")').first()
        if (await emailRow.isVisible()) {
          this.logger.info('找到 Trae 邮件，点击进入详情...')
          await emailRow.click()
          await gmailPage.waitForTimeout(2000)

          // 提取验证码，Gmail 邮件正文通常在一个带有特定 class 的 div 中
          const bodyText = await gmailPage.locator('.a3s').innerText()
          const match = bodyText.match(/\b\d{6}\b/)
          if (match) {
            code = match[0]
            this.logger.info(`成功提取验证码: ${code}`)
            break
          } else {
            this.logger.info('邮件内容中未找到 6 位验证码，返回收件箱...')
            await gmailPage.goBack()
          }
        }

        this.logger.info(`未找到邮件，等待重试...(${i + 1}/6)`)
        await gmailPage.waitForTimeout(5000)
        await gmailPage.reload()
        await gmailPage.waitForLoadState('networkidle')
      }

      if (!code) {
        throw new Error('获取验证码超时或未找到包含验证码的 Trae 邮件')
      }

      this.logger.info('关闭 Gmail 页面...')
      await gmailPage.close()

      // 3. 回到 Trae 页面填写验证码
      this.logger.info('回到 Trae 页面填写验证码...')
      await traePage.bringToFront()
      const codeInput = traePage
        .locator('input[placeholder*="code" i], input[name*="code" i]')
        .first()
      if (await codeInput.isVisible()) {
        await codeInput.fill(code)
      } else {
        await traePage.keyboard.type(code)
      }

      this.logger.info('提交验证码...')
      await traePage.keyboard.press('Enter')

      await traePage.waitForTimeout(5000)

      const traeAccount = {
        id: uuidv4(),
        email,
        password,
        createdAt: new Date().toISOString()
      }
      this.logger.info('Trae 账号注册成功')
      this.logger.info('账号切换完成，可以使用 Trae 本地客户端验证')

      return { success: true, data: traeAccount }
    } catch (error: any) {
      this.logger.error('申请 Trae 账号失败:', error.message)
      return { success: false, error: error.message }
    } finally {
      if (context) {
        await context.close()
      }
      if (browser) {
        await browser.close()
      }
    }
  }
}

export const traeManager = new TraeManager()
