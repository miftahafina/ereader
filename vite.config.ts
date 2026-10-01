import { cpSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

const root = dirname(fileURLToPath(import.meta.url))

function pdfjsAssets(): Plugin {
  const source = resolve(root, 'node_modules/pdfjs-dist')
  const target = resolve(root, 'public/pdfjs')
  const dirs = ['wasm', 'standard_fonts', 'cmaps']
  const copy = () => {
    for (const dir of dirs) {
      const from = resolve(source, dir)
      if (!existsSync(from)) continue
      cpSync(from, resolve(target, dir), { recursive: true })
    }
  }
  return {
    name: 'pdfjs-assets',
    configResolved() {
      copy()
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), pdfjsAssets()],
})
