import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Library-Management-System/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['@electric-sql/pglite'],
  },
})
