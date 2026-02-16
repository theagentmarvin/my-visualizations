import { defineConfig } from 'vite';

export default defineConfig({
  base: '/my-visualizations/projects/bim-mobile-viewer/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          thatopen: ['@thatopen/components', '@thatopen/components-front', '@thatopen/ui']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['web-ifc']
  },
  server: {
    port: 3000,
    host: true
  }
});