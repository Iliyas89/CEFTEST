import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',   //base: '/CEFTEST/', // <-- Должно быть ИМЕННО CEFTEST, как в ссылке
})