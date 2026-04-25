import { defineConfig } from 'tsup'
import fs from 'fs'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  entry: ['src/server/index.ts', 'src/server/migrate.ts'],
  format: ['cjs'],
  outDir: 'dist/server',
  clean: true,
  env: {
    APP_VERSION: pkg.version
  }
})
