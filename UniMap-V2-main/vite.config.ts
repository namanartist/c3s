// vite.config.ts
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { readFileSync } from 'node:fs'
import react from '@vitejs/plugin-react'
import path from 'path'

const seedCollections: Record<string, unknown[]> = {
  nodes: JSON.parse(readFileSync(path.resolve(__dirname, 'init-data/nodes.json'), 'utf8')) as unknown[],
  edges: JSON.parse(readFileSync(path.resolve(__dirname, 'init-data/edges.json'), 'utf8')) as unknown[],
  buildings: JSON.parse(readFileSync(path.resolve(__dirname, 'init-data/buildings.json'), 'utf8')) as unknown[],
  floors: JSON.parse(readFileSync(path.resolve(__dirname, 'init-data/floors.json'), 'utf8')) as unknown[],
}

function localSeedApiPlugin(): Plugin {
  return {
    name: 'unimap-local-seed-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api', (request, response, next) => {
        if (request.method !== 'GET') return next()
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
        const collectionName = pathname.split('/').filter(Boolean).at(-1)
        const data = collectionName ? seedCollections[collectionName] : undefined
        if (!data) return next()

        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json; charset=utf-8')
        response.end(JSON.stringify({ data }))
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), localSeedApiPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'react-vendor';
            }
            if (id.includes('zustand')) {
              return 'zustand';
            }
            if (id.includes('lucide-react') || id.includes('lucide')) {
              return 'lucide';
            }
          }
        },
      } as any,
    },
  },
})

