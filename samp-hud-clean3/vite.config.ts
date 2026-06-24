import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/CEFTEST/', // Обязательно добавляем эту строчку, чтобы пути к ассетам стали относительными!
  build: {
    target: 'es2017',
  },
});