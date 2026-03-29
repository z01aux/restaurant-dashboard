import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// Leer package.json para obtener la versión
const packageJson = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf-8'))

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  define: {
    // Inyectar la versión como variable de entorno en el build
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(packageJson.version),
  },
})
