import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/iras-auth': {
        target: 'https://iras-auth.pages.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/iras-auth/, '/api'),
      },
      '/api/iras-student': {
        target: 'https://irastools.pages.dev',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/iras-student/, '/api'),
      },
    },
  },
})