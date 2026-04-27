import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// On GitHub Pages we serve from /<repo-name>/. The CI workflow passes the
// repo name via VITE_BASE_URL at build time. Locally `npm run dev` and
// `npx vite build` (no env) keep the default '/' so dev still works.
const baseUrl = process.env.VITE_BASE_URL || '/'

export default defineConfig({
  base: baseUrl,
  plugins: [vue(), tailwindcss()],
  server: {
    port: 3005,
  },
})
