import type { Handler } from '@netlify/functions'
import { isAuthenticated, parseCookie, unauthorized } from './lib/auth'
import jwt from 'jsonwebtoken'
import { getJwtSecret } from './lib/auth'

export const handler: Handler = async (event) => {
  if (!isAuthenticated(event)) return unauthorized()

  const token = parseCookie(event)!
  const payload = jwt.verify(token, getJwtSecret()) as { sub: string }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: payload.sub }),
  }
}
