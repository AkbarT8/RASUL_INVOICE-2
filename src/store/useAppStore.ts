import { create } from 'zustand'
import type { AppStore, Client, Column, Proforma } from '../../shared/types'
import { api } from '../lib/api'
import { uid } from '../lib/utils'
import {
  getClientCredentials,
  loadLocalStore,
  saveClientCredentials,
  saveLocalStore,
  isServerApiEnabled,
} from '../lib/persistence'
import { findAdminByCredentials, loadAdminAccounts } from '../lib/admins'
import { searchStore } from '../lib/search'
import { loadOpenTabs, makeTab, saveOpenTabs, type OpenTab } from '../lib/open-tabs'
import type { SearchResult } from '../../shared/types'

const DEFAULT_SETTINGS: AppStore['settings'] = {
  defaultStatus: 'Draft',
  defaultColumnWidth: 120,
  compactTable: false,
  confirmDeletes: true,
  proformaPrefix: 'PF-',
  currencySymbol: '€',
  defaultRowsToAdd: 1,
  defaultColsToAdd: 1,
  autoSaveMs: 400,
  showGridLines: true,
  invoiceCompanyName: 'Proforma Workspace',
  invoiceFooter: 'Thank you for your business.',
  dateFormat: 'eu',
}

interface AppState {
  loaded: boolean
  saving: boolean
  username: string | null
  store: AppStore
  selectedClientId: string | null
  selectedProformaId: string | null
  openTabs: OpenTab[]
  setSelectedClient: (id: string | null) => void
  setSelectedProforma: (id: string | null) => void
  bootstrap: () => Promise<boolean>
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  persist: () => Promise<void>
  search: (q: string) => Promise<SearchResult[]>
  updateStore: (updater: (store: AppStore) => AppStore) => void
  updateCredentials: (input: {
    username: string
    newPassword?: string
    currentPassword: string
  }) => void
  addClient: (data: Omit<Client, 'id' | 'createdAt'>) => Client
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
  addProforma: (clientId: string) => Proforma
  updateProforma: (id: string, data: Partial<Proforma>) => void
  deleteProforma: (id: string) => void
  pinClient: (clientId: string) => void
  pinProforma: (clientId: string, proformaId: string) => void
  unpinTab: (tabId: string) => void
}

let saveTimer: ReturnType<typeof setTimeout> | null = null
const SESSION_KEY = 'proforma_session_user'

function defaultColumns(width: number): Column[] {
  return [
    { id: uid('col'), name: 'Article', width, hidden: false, order: 0, color: null },
    { id: uid('col'), name: 'Quantity', width: Math.min(width, 96), hidden: false, order: 1, color: null },
    { id: uid('col'), name: 'Price', width: Math.min(width, 96), hidden: false, order: 2, color: null },
  ]
}

export const useAppStore = create<AppState>((set, get) => ({
  loaded: false,
  saving: false,
  username: null,
  store: { clients: [], proformas: [], settings: DEFAULT_SETTINGS },
  selectedClientId: null,
  selectedProformaId: null,
  openTabs: loadOpenTabs(),

  setSelectedClient: (id) => set({ selectedClientId: id }),
  setSelectedProforma: (id) => set({ selectedProformaId: id }),

  bootstrap: async () => {
    if (isServerApiEnabled()) {
      try {
        const me = await api.me()
        const store = await api.getData()
        set({
          username: me.username,
          store: { ...store, settings: { ...DEFAULT_SETTINGS, ...store.settings } },
          loaded: true,
        })
        return true
      } catch {
        set({ loaded: true })
        return false
      }
    }

    const username = sessionStorage.getItem(SESSION_KEY)
    if (username) {
      const store = loadLocalStore()
      set({ username, store, loaded: true })
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
    const admins = loadAdminAccounts()
    const okPrimary = username === creds.username && password === creds.password
    const okAdmin = Boolean(findAdminByCredentials(username, password, admins))
    if (!okPrimary && !okAdmin) {
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
      store: { clients: [], proformas: [], settings: DEFAULT_SETTINGS },
      selectedClientId: null,
      selectedProformaId: null,
    })
  },

  updateCredentials: ({ username, newPassword, currentPassword }) => {
    const creds = getClientCredentials()
    if (currentPassword !== creds.password) {
      throw new Error('Current password is incorrect')
    }
    const next = {
      username,
      password: newPassword && newPassword.length > 0 ? newPassword : creds.password,
    }
    saveClientCredentials(next)
    sessionStorage.setItem(SESSION_KEY, username)
    set({ username })
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
    }, get().store.settings.autoSaveMs || 400)
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
    const w = get().store.settings.defaultColumnWidth
    const proforma: Proforma = {
      id: uid('pf'),
      clientId,
      number: `${get().store.settings.proformaPrefix}${String(count + 1).padStart(3, '0')}`,
      date: new Date().toISOString().slice(0, 10),
      status: get().store.settings.defaultStatus,
      notes: '',
      columns: defaultColumns(w),
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
    set((s) => {
      const openTabs = s.openTabs.filter(
        (t) => !(t.type === 'proforma' && t.proformaId === id),
      )
      saveOpenTabs(openTabs)
      return { openTabs }
    })
  },

  pinClient: (clientId) => {
    const tab = makeTab({ type: 'client', clientId })
    set((s) => {
      if (s.openTabs.some((t) => t.id === tab.id)) return s
      const openTabs = [...s.openTabs, tab]
      saveOpenTabs(openTabs)
      return { openTabs }
    })
  },

  pinProforma: (clientId, proformaId) => {
    const clientTab = makeTab({ type: 'client', clientId })
    const pfTab = makeTab({ type: 'proforma', clientId, proformaId })
    set((s) => {
      let openTabs = [...s.openTabs]
      if (!openTabs.some((t) => t.id === clientTab.id)) openTabs.push(clientTab)
      if (!openTabs.some((t) => t.id === pfTab.id)) openTabs.push(pfTab)
      saveOpenTabs(openTabs)
      return { openTabs }
    })
  },

  unpinTab: (tabId) => {
    set((s) => {
      const openTabs = s.openTabs.filter((t) => t.id !== tabId)
      saveOpenTabs(openTabs)
      return { openTabs }
    })
  },
}))
