import type { Handler } from '@netlify/functions'
import {
  getCredentials,
  sessionCookie,
  signToken,
} from './lib/auth'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  let body: { username?: string; password?: string }
  try {
    body = JSON.parse(event.body || '{}')
  } catch {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid JSON' }),
    }
  }

  const creds = getCredentials()
  if (body.username !== creds.username || body.password !== creds.password) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid credentials' }),
    }
  }

  const token = signToken(body.username!)
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': sessionCookie(token),
    },
    body: JSON.stringify({ ok: true, username: body.username }),
  }
}
