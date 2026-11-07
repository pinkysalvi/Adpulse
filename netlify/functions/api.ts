// Netlify Function: serves every /api/* request using the shared handler.
import { handle } from '../../server/handler'

export default async (req: Request): Promise<Response> => {
  const result = handle(req.method, new URL(req.url))
  return new Response(JSON.stringify(result.body), {
    status: result.status,
    headers: {
      'Content-Type': 'application/json',
      // data only changes hourly; let the CDN and browser reuse responses briefly
      'Cache-Control': result.status === 200 ? 'public, max-age=300' : 'no-store',
    },
  })
}

export const config = { path: '/api/*' }
