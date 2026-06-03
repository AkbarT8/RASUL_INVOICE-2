import type { Handler } from '@netlify/functions'
import { isAuthenticated, unauthorized } from './lib/auth'
import { loadStore, saveStore } from './lib/store'
import type { AppStore } from '../../shared/types'

export const handler: Handler = async (event) => {
  if (!isAuthenticated(event)) return unauthorized()

  if (event.httpMethod === 'GET') {
    const store = await loadStore()
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(store),
    }
  }

  if (event.httpMethod === 'PUT') {
    let store: AppStore
    try {
      store = JSON.parse(event.body || '{}')
    } catch {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid JSON' }),
      }
    }
    await saveStore(store)
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: true }),
    }
  }

  return { statusCode: 405, body: 'Method Not Allowed' }
}
