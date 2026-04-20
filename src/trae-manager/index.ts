import { chromium } from 'playwright';

export class TraeManager {
  async applyTempEmail() {
    try {
      // 启动浏览器，headless 设为 false 以便能看到打开的过程
      const browser = await chromium.launch({ headless: false });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      // 导航到 Trae 官网
      await page.goto('https://www.trae.ai/');
      
      // 暂时只打开网页，不关闭浏览器以便用户查看
      
      return { success: true, message: '成功打开 Trae 官网' };
    } catch (error: any) {
      console.error('打开 Trae 官网失败:', error);
      throw error;
    }
  }
}
