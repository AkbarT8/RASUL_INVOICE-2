import type { Handler } from '@netlify/functions'
import { clearSessionCookie } from './lib/auth'

export const handler: Handler = async () => ({
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Set-Cookie': clearSessionCookie(),
  },
  body: JSON.stringify({ ok: true }),
})
