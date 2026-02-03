import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'K线训练工具',
        short_name: 'K线训练',
        description: '股票K线图表训练工具',
        theme_color: '#7c3aed',
        background_color: '#ffffff',
        display: 'standalone'
      }
    })
  ],
  server: {
    proxy: {
      '/tushare': {
        target: 'https://api.tushare.pro',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/tushare/, '')
      }
    }
  }
})
