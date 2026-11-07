/// <reference types="vitest/config" />
import { defineConfig, type Plugin, type ViteDevServer, type PreviewServer } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

/**
 * Serves the same API code that runs on Netlify Functions (server/handler.ts)
 * during `npm run dev` and `npm run preview`, so no Netlify CLI is needed locally.
 */
function localApi(): Plugin {
  const attach = (server: ViteDevServer | PreviewServer, load: () => Promise<typeof import('./server/handler')>) => {
    server.middlewares.use('/api', async (req, res) => {
      try {
        const { handle } = await load()
        const url = new URL(req.originalUrl ?? req.url ?? '/', 'http://localhost')
        // small artificial delay so loading states are visible while developing
        await new Promise(r => setTimeout(r, 250 + Math.random() * 250))
        const result = handle(req.method ?? 'GET', url)
        res.statusCode = result.status
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(result.body))
      } catch (err) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: String(err) }))
      }
    })
  }
  return {
    name: 'adpulse-local-api',
    configureServer(server) {
      attach(server, () => server.ssrLoadModule('/server/handler.ts') as Promise<typeof import('./server/handler')>)
    },
    configurePreviewServer(server) {
      attach(server, () => import('./server/handler'))
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    localApi(),
    mode === 'analyze' && visualizer({ filename: 'dist/stats.html', gzipSize: true, open: false }),
  ],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}', 'server/**/*.test.ts'],
  },
}))
