import type { AppStore, SearchResult } from '../../shared/types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }
  return res.json()
}

export const api = {
  login: (username: string, password: string) =>
    request<{ ok: boolean; username: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  logout: () => request<{ ok: boolean }>('/api/logout', { method: 'POST' }),

  me: () => request<{ username: string }>('/api/me'),

  getData: () => request<AppStore>('/api/data'),

  saveData: (store: AppStore) =>
    request<{ ok: boolean }>('/api/data', {
      method: 'PUT',
      body: JSON.stringify(store),
    }),

  search: (q: string) =>
    request<SearchResult[]>(`/api/search?q=${encodeURIComponent(q)}`),
}
