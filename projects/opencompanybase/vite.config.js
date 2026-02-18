import { defineConfig } from 'vite'
import { fileURLToPath } from 'url'

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      'web-ifc': fileURLToPath(new URL('./src/web-ifc-stub.js', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
