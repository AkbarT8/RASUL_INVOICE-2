import { create } from 'zustand'
import type { AppStore, Client, Proforma } from '../../shared/types'
import { api } from '../lib/api'
import { uid } from '../lib/utils'
import {
  getClientCredentials,
  loadLocalStore,
  saveLocalStore,
  isServerApiEnabled,
} from '../lib/persistence'
import { searchStore } from '../lib/search'
import type { SearchResult } from '../../shared/types'

interface AppState {
  loaded: boolean
  saving: boolean
  username: string | null
  store: AppStore
  selectedClientId: string | null
  selectedProformaId: string | null
  setSelectedClient: (id: string | null) => void
  setSelectedProforma: (id: string | null) => void
  bootstrap: () => Promise<boolean>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  persist: () => Promise<void>
  search: (q: string) => Promise<SearchResult[]>
  updateStore: (updater: (store: AppStore) => AppStore) => void
  addClient: (data: Omit<Client, 'id' | 'createdAt'>) => Client
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
  addProforma: (clientId: string) => Proforma
  updateProforma: (id: string, data: Partial<Proforma>) => void
  deleteProforma: (id: string) => void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
const SESSION_KEY = 'proforma_session_user'

export const useAppStore = create<AppState>((set, get) => ({
  loaded: false,
  saving: false,
  username: null,
  store: { clients: [], proformas: [], settings: { defaultStatus: 'Draft' } },
  selectedClientId: null,
  selectedProformaId: null,

  setSelectedClient: (id) => set({ selectedClientId: id }),
  setSelectedProforma: (id) => set({ selectedProformaId: id }),

  bootstrap: async () => {
    if (isServerApiEnabled()) {
      try {
        const me = await api.me()
        const store = await api.getData()
        set({ username: me.username, store, loaded: true })
        return true
      } catch {
        set({ loaded: true })
        return false
      }
    }

    const username = sessionStorage.getItem(SESSION_KEY)
    if (username) {
      set({ username, store: loadLocalStore(), loaded: true })
      return true
    }
    set({ loaded: true })
    return false
  },

  login: async (username, password) => {
    if (isServerApiEnabled()) {
      await api.login(username, password)
      const store = await api.getData()
      set({ username, store, loaded: true })
      return
    }

    const creds = getClientCredentials()
    if (username !== creds.username || password !== creds.password) {
      throw new Error('Invalid credentials')
    }
    sessionStorage.setItem(SESSION_KEY, username)
    set({ username, store: loadLocalStore(), loaded: true })
  },

  logout: async () => {
    if (isServerApiEnabled()) {
      await api.logout()
    } else {
      sessionStorage.removeItem(SESSION_KEY)
    }
    set({
      username: null,
      store: { clients: [], proformas: [], settings: { defaultStatus: 'Draft' } },
      selectedClientId: null,
      selectedProformaId: null,
    })
  },

  persist: async () => {
    set({ saving: true })
    try {
      if (isServerApiEnabled()) {
        await api.saveData(get().store)
      } else {
        saveLocalStore(get().store)
      }
    } finally {
      set({ saving: false })
    }
  },

  search: async (q) => {
    if (isServerApiEnabled()) return api.search(q)
    return searchStore(get().store, q)
  },

  updateStore: (updater) => {
    const next = updater(get().store)
    set({ store: next })
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      get().persist()
    }, 400)
  },

  addClient: (data) => {
    const client: Client = {
      ...data,
      id: uid('client'),
      createdAt: new Date().toISOString(),
    }
    get().updateStore((s) => ({ ...s, clients: [client, ...s.clients] }))
    return client
  },

  updateClient: (id, data) => {
    get().updateStore((s) => ({
      ...s,
      clients: s.clients.map((c) => (c.id === id ? { ...c, ...data } : c)),
    }))
  },

  deleteClient: (id) => {
    get().updateStore((s) => ({
      ...s,
      clients: s.clients.filter((c) => c.id !== id),
      proformas: s.proformas.filter((p) => p.clientId !== id),
    }))
  },

  addProforma: (clientId) => {
    const count = get().store.proformas.filter((p) => p.clientId === clientId).length
    const proforma: Proforma = {
      id: uid('pf'),
      clientId,
      number: `PF-${String(count + 1).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      status: get().store.settings.defaultStatus,
      notes: '',
      columns: [
        { id: uid('col'), name: 'Article', width: 180, hidden: false, order: 0 },
        { id: uid('col'), name: 'Quantity', width: 100, hidden: false, order: 1 },
        { id: uid('col'), name: 'Price', width: 100, hidden: false, order: 2 },
      ],
      rows: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    get().updateStore((s) => ({ ...s, proformas: [proforma, ...s.proformas] }))
    return proforma
  },

  updateProforma: (id, data) => {
    get().updateStore((s) => ({
      ...s,
      proformas: s.proformas.map((p) =>
        p.id === id
          ? { ...p, ...data, updatedAt: new Date().toISOString() }
          : p,
      ),
    }))
  },

  deleteProforma: (id) => {
    get().updateStore((s) => ({
      ...s,
      proformas: s.proformas.filter((p) => p.id !== id),
    }))
  },
}))
