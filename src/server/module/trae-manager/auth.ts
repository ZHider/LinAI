import { chromium, Browser, BrowserContext } from 'playwright'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'
import os from 'os'
import { Logger } from '../utils/logger'

const CHROME_DATA_DIR = path.join(process.cwd(), '/data/chrome-data')

export class BrowserAuthManager {
  constructor(private logger: Logger) {}

  /**
   * 确保独立的 Chrome 进程正在运行并开启远程调试
   */
  private async ensureChromeRunning(): Promise<{
    browser: Browser
    context: BrowserContext
  }> {
    let browser: Browser

    try {
      this.logger.info('尝试连接现有的 Chrome 调试端口 (9222)...')
      browser = await chromium.connectOverCDP('http://localhost:9222')
      this.logger.info('成功连接到已运行的 Chrome 进程。')
    } catch (e) {
      this.logger.info('未检测到运行中的 Chrome，准备启动独立 Chrome 进程...')

      let chromePath = 'chrome'
      if (os.platform() === 'win32') {
        const localAppData = process.env.LOCALAPPDATA || ''
        const programFiles = process.env.PROGRAMFILES || 'C:\\Program Files'
        const programFilesX86 =
          process.env['PROGRAMFILES(X86)'] || 'C:\\Program Files (x86)'

        const paths = [
          path.join(programFiles, 'Google\\Chrome\\Application\\chrome.exe'),
          path.join(programFilesX86, 'Google\\Chrome\\Application\\chrome.exe'),
          path.join(localAppData, 'Google\\Chrome\\Application\\chrome.exe')
        ]
        chromePath = paths.find((p) => fs.existsSync(p)) || 'chrome'
      } else if (os.platform() === 'darwin') {
        chromePath =
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      } else {
        chromePath = '/usr/bin/google-chrome'
      }

      const args = [
        '--remote-debugging-port=9222',
        `--user-data-dir=${CHROME_DATA_DIR}`,
        '--no-first-run',
        '--no-default-browser-check'
      ]

      const child = spawn(chromePath, args, {
        detached: true,
        stdio: 'ignore'
      })
      child.unref() // 允许主进程退出

      this.logger.info(`已启动 Chrome 进程，用户数据目录: ${CHROME_DATA_DIR}`)

      // 等待几秒钟让 Chrome 启动并监听端口
      await new Promise((resolve) => setTimeout(resolve, 3000))

      try {
        browser = await chromium.connectOverCDP('http://localhost:9222')
      } catch (connectError: any) {
        throw new Error(
          `无法连接到刚启动的 Chrome 调试端口: ${connectError.message}`
        )
      }
    }

    const contexts = browser.contexts()
    const context =
      contexts.length > 0 ? contexts[0] : await browser.newContext()

    return { browser, context }
  }

  /**
   * 启动浏览器让用户手动登录 Google
   */
  async loginGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      this.logger.info('--- 开始手动登录 Google 账号 ---')
      this.logger.info('启动独立浏览器准备登录 Google...')

      const { browser, context } = await this.ensureChromeRunning()
      const page = await context.newPage()

      await page.goto('https://accounts.google.com')
      this.logger.info('====================================================')
      this.logger.info('请在弹出的浏览器中手动完成 Google 账号登录。')
      this.logger.info('登录成功并跳转后（通常跳转到 myaccount.google.com），')
      this.logger.info('程序会自动保存登录状态并关闭页面。')
      this.logger.info('====================================================')

      try {
        // 等待用户登录成功后跳转到 myaccount.google.com
        await page.waitForURL('**/myaccount.google.com/**', { timeout: 0 })
        this.logger.info('检测到登录成功！正在保存状态...')
      } catch (e: any) {
        this.logger.error('等待登录状态时发生异常或手动关闭', e.message)
      }

      await page.close() // 不关闭整个 browser，因为是独立进程
      await browser.close() // 断开 CDP 连接

      return { success: true }
    } catch (error: any) {
      this.logger.error('登录 Google 失败:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * 获取一个带有已保存登录状态的浏览器上下文
   */
  async getAuthenticatedContext(): Promise<{
    browser: Browser
    context: BrowserContext
  }> {
    const { browser, context } = await this.ensureChromeRunning()

    // 如果存在 auth.json 且当前 context 还没有设置（对于独立进程，通常 user-data-dir 已经包含了状态）
    // 为了兼容原有逻辑，这里可以选择重新加载一下 storageState。但独立 Chrome 进程本身具有持久化能力。

    return { browser, context }
  }

  /**
   * 检查谷歌账号登录状态并获取账号信息
   */
  async checkLoginStatus(): Promise<{
    isLoggedIn: boolean
    accountInfo?: { email: string }
  }> {
    let browser: Browser | null = null
    try {
      try {
        browser = await chromium.connectOverCDP('http://localhost:9222')
      } catch (connectError) {
        return {
          isLoggedIn: false
        }
      }

      const contexts = browser.contexts()
      const context =
        contexts.length > 0 ? contexts[0] : await browser.newContext()
      const page = await context.newPage()

      // 访问 myaccount.google.com 获取账号信息
      await page.goto('https://myaccount.google.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 15000
      })

      if (page.url().includes('signin')) {
        await page.close()
        return { isLoggedIn: false }
      }

      // 尝试从页面提取邮箱信息
      const content = await page.content()
      const emails = content.match(
        /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      )

      // 过滤掉常见的非个人邮箱
      const validEmails = emails
        ? [...new Set(emails)].filter(
            (e) => !e.includes('s.whatsapp.net') && e.includes('@gmail.com')
          )
        : []

      const email = validEmails.length > 0 ? validEmails[0] : '已登录用户'
      await page.close()

      return {
        isLoggedIn: true,
        accountInfo: { email }
      }
    } catch (e: any) {
      this.logger.error('检查登录状态失败:', e.message)
      // 如果出现异常但存在 auth.json，保守起见可以认为已登录但获取信息失败
      return { isLoggedIn: false }
    } finally {
      // 独立进程模式下，我们只需断开 CDP 连接，不调用 browser.close() 以免关闭 Chrome 实例
      if (browser) {
        await browser.close()
        // 注意：playwright 中 connectOverCDP 获取的 browser 执行 close()
        // 默认只会断开连接，不会关闭远程浏览器（除非设置了关闭行为）。
      }
    }
  }
}
