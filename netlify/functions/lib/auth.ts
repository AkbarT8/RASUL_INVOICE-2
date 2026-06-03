import jwt from 'jsonwebtoken'
import type { HandlerEvent } from '@netlify/functions'

const COOKIE_NAME = 'proforma_session'

export function getJwtSecret(): string {
  return process.env.JWT_SECRET || 'proforma-dev-secret-change-in-production'
}

export function getCredentials(): { username: string; password: string } {
  return {
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'Proforma2026!',
  }
}

export function signToken(username: string): string {
  return jwt.sign({ sub: username }, getJwtSecret(), { expiresIn: '7d' })
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, getJwtSecret())
    return true
  } catch {
    return false
  }
}

export function parseCookie(event: HandlerEvent): string | null {
  const cookie = event.headers.cookie || event.headers.Cookie
  if (!cookie) return null
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`))
  return match?.[1] ?? null
}

export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800${secure}`
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}

export function isAuthenticated(event: HandlerEvent): boolean {
  const token = parseCookie(event)
  return token ? verifyToken(token) : false
}

export function unauthorized() {
  return {
    statusCode: 401,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: 'Unauthorized' }),
  }
}
