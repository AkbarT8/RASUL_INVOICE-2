import type { AppStore } from '../../shared/types'

const STORAGE_KEY = 'proforma_workspace_store'

const DEFAULT_STORE: AppStore = {
  clients: [],
  proformas: [],
  settings: { defaultStatus: 'Draft' },
}

export function loadLocalStore(): AppStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_STORE)
    return { ...DEFAULT_STORE, ...JSON.parse(raw) }
  } catch {
    return structuredClone(DEFAULT_STORE)
  }
}

export function saveLocalStore(store: AppStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getClientCredentials() {
  return {
    username: import.meta.env.VITE_ADMIN_USERNAME || 'admin',
    password: import.meta.env.VITE_ADMIN_PASSWORD || 'Proforma2026!',
  }
}

export function useServerApi(): boolean {
  return import.meta.env.VITE_USE_API === 'true'
}
