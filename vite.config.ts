import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // GitHub Pages serves the site from https://yo5on.github.io/Aboutme/
  base: '/Aboutme/',
  plugins: [react()],
  server: { host: true, port: 5173 },
})
