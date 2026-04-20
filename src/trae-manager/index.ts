import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { Logger } from '../utils/logger';
import { MailGwClient } from './mail-gw';
import { TraeStorage } from './storage';
import { v4 as uuidv4 } from 'uuid';

export class TraeManager {
  public logger: Logger;
  private mailClient: MailGwClient;

  constructor() {
    this.logger = new Logger('trae');
    this.mailClient = new MailGwClient();
  }

  private generateRandomPassword(length: number = 12): string {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    let retVal = "";
    for (let i = 0, n = charset.length; i < length; ++i) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  }

  private async pollForVerificationCode(email: string, maxAttempts: number = 4, intervalMs: number = 10000): Promise<string | null> {
    this.logger.info(`开始轮询邮件验证码，邮箱: ${email}`);
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      this.logger.info(`第 ${attempt} 次轮询...`);
      try {
        const messages = await this.mailClient.getMessages();
        const traeMessage = messages.find(m => m.subject.toLowerCase().includes('trae') || m.intro.toLowerCase().includes('verification'));

        if (traeMessage) {
          this.logger.info('发现 Trae 邮件，正在获取详情...');
          const detail = await this.mailClient.getMessage(traeMessage.id);
          const match = detail.text.match(/\d{6}/);
          if (match) {
            this.logger.info(`成功获取验证码: ${match[0]}`);
            return match[0];
          }
        }
      } catch (e: any) {
        this.logger.error('轮询邮件出错:', e.message);
      }

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, intervalMs));
      }
    }
    return null;
  }

  async applyTempEmail() {
    let browser: Browser | null = null;
    try {
      this.logger.info('--- 开始申请 Trae 账号 ---');

      // 1. 获取域名并创建邮箱
      const domains = await this.mailClient.getDomains();
      if (domains.length === 0) throw new Error('未能获取到临时邮箱域名');

      const domain = domains[0];
      const randomUser = Math.random().toString(36).substring(2, 10);
      const email = `${randomUser}@${domain}`;
      const password = this.generateRandomPassword();

      this.logger.info(`准备创建邮箱: ${email}`);
      const account = await this.mailClient.createAccount(email, password);
      await this.mailClient.login(email, password);
      this.logger.info('临时邮箱创建并登录成功');

      // 2. Playwright 自动化
      this.logger.info('启动浏览器进行 Trae 注册...');
      browser = await chromium.launch({ headless: false }); // 保持可见以便观察，或根据需要设为 true
      const context = await browser.newContext();
      const page = await context.newPage();

      this.logger.info('访问 Trae 注册页面...');
      await page.goto('https://www.trae.ai/sign-up');

      // 填写邮箱和密码
      this.logger.info('填写邮箱和密码...');
      await page.fill('input[type="email"]', email);
      // 注意：Trae 注册页面的选择器可能需要根据实际页面结构调整
      // 假设密码框的选择器，如果不正确，可能需要调整
      await page.fill('input[type="password"]', password);

      // 点击发送验证码或下一步
      // 这取决于 Trae 官网的按钮文本和结构，通常是 "Send Code" 或类似
      this.logger.info('点击发送验证码...');
      const sendCodeButton = await page.getByRole('button', { name: /Send|Continue|Sign up/i }).first();
      await sendCodeButton.click();

      // 3. 轮询验证码
      const code = await this.pollForVerificationCode(email);
      if (!code) {
        this.logger.error('获取验证码超时或该域名被封禁');
        throw new Error('获取验证码超时或该域名被封禁');
      }

      // 4. 输入验证码并完成注册
      this.logger.info('输入验证码...');
      // 假设验证码输入框的选择器
      const codeInput = await page.locator('input[placeholder*="code" i], input[name*="code" i]').first();
      if (await codeInput.isVisible()) {
        await codeInput.fill(code);
      } else {
        // 尝试逐个输入
        await page.keyboard.type(code);
      }

      this.logger.info('提交验证码...');
      await page.keyboard.press('Enter');

      // 等待注册成功的标志，比如跳转到首页或显示欢迎信息
      await page.waitForTimeout(5000);

      // 5. 记录账号
      const traeAccount = {
        id: uuidv4(),
        email,
        password,
        createdAt: new Date().toISOString()
      };
      await TraeStorage.saveAccount(traeAccount);
      this.logger.info('Trae 账号注册成功并已记录');

      return { success: true, data: traeAccount };
    } catch (error: any) {
      this.logger.error('申请 Trae 账号失败:', error.message);
      return { success: false, error: error.message };
    } finally {
      if (browser) {
        // await browser.close(); // 暂时不关闭，方便调试
      }
    }
  }

  async getHistory() {
    return await TraeStorage.getAccounts();
  }

  async deleteHistory(id: string) {
    await TraeStorage.deleteAccount(id);
    return { success: true };
  }
}

export const traeManager = new TraeManager();
