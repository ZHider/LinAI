import fs from 'fs-extra';
import path from 'path';
import { config } from '../wan-downloader/config';

export interface TraeAccount {
  id: string;
  email: string;
  password: string;
  createdAt: string;
}

const STORAGE_FILE = path.join(config.LOG_DIR, 'trae_accounts.json');

export class TraeStorage {
  static async getAccounts(): Promise<TraeAccount[]> {
    try {
      if (!(await fs.pathExists(STORAGE_FILE))) {
        return [];
      }
      return await fs.readJson(STORAGE_FILE);
    } catch (e) {
      console.error('读取 Trae 账号存储失败:', e);
      return [];
    }
  }

  static async saveAccount(account: TraeAccount) {
    const accounts = await this.getAccounts();
    accounts.push(account);
    await fs.ensureDir(path.dirname(STORAGE_FILE));
    await fs.writeJson(STORAGE_FILE, accounts, { spaces: 2 });
  }

  static async deleteAccount(id: string) {
    const accounts = await this.getAccounts();
    const updatedAccounts = accounts.filter(a => a.id !== id);
    await fs.writeJson(STORAGE_FILE, updatedAccounts, { spaces: 2 });
  }
}
