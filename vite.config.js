import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Для GitHub Pages после создания репозитория можно заменить на '/название-репозитория/'
  // Если оставить './', локально и на GitHub Pages тоже обычно работает.
  base: './',
})
