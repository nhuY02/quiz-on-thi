import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Giúp deploy lên GitHub Pages (sub-path /repo-name/) không bị lỗi đường dẫn asset
})
