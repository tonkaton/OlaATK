import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '../', 'VITE_')

  return {
    plugins: [react()],
    envDir: '../',
    base: env.VITE_BASE_PATH || '/admin',
    server: { port: 5173 },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})