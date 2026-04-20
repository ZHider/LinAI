import { chromium } from 'playwright';
import { logger } from './utils/logger';

export class GeminiManager {
  private static instance: GeminiManager;

  private constructor() {}

  public static getInstance(): GeminiManager {
    if (!GeminiManager.instance) {
      GeminiManager.instance = new GeminiManager();
    }
    return GeminiManager.instance;
  }

  public async openGemini() {
    logger.info('Opening Gemini website with Playwright');
    try {
      const browser = await chromium.launch({
        headless: false, // Show the browser
      });
      const context = await browser.newContext();
      const page = await context.newPage();
      await page.goto('https://gemini.google.com/');
      
      // We don't close the browser immediately so the user can use it
      // In a real scenario, we might want to manage browser instances better
      logger.info('Gemini website opened successfully');
      return { success: true };
    } catch (error) {
      logger.error('Failed to open Gemini website', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

export const geminiManager = GeminiManager.getInstance();
