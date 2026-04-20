import fs from 'fs-extra'
import path from 'path'

export interface TraeAccount {
  id: string
  email: string
  createdAt: string
}

const ALIAS_RECORDS_FILE = path.join('data', 'trae_alias_records.json')

export class TraeStorage {
  static async getAliasRecords(): Promise<Record<string, string>> {
    try {
      if (!(await fs.pathExists(ALIAS_RECORDS_FILE))) {
        return {}
      }
      return await fs.readJson(ALIAS_RECORDS_FILE)
    } catch (e) {
      return {}
    }
  }

  static async recordAliasApplyTime(email: string, time: string) {
    await fs.ensureDir(path.dirname(ALIAS_RECORDS_FILE))
    const records = await this.getAliasRecords()
    records[email] = time
    await fs.writeJson(ALIAS_RECORDS_FILE, records, { spaces: 2 })
  }
}
