import type { AppStore, Column } from '../../shared/types'
import { normalizeCell } from './cell-format'

const STORAGE_KEY = 'proforma_workspace_store'
const CREDS_KEY = 'proforma_credentials'

const DEFAULT_STORE: AppStore = {
  clients: [],
  proformas: [],
  settings: {
    defaultStatus: 'Draft',
    defaultColumnWidth: 168,
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
  },
}

export interface StoredCredentials {
  username: string
  password: string
}

export function loadLocalStore(): AppStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return structuredClone(DEFAULT_STORE)
    const parsed = JSON.parse(raw) as AppStore
    return {
      ...DEFAULT_STORE,
      ...parsed,
      settings: { ...DEFAULT_STORE.settings, ...parsed.settings },
      proformas: (parsed.proformas || []).map((pf) => ({
        ...pf,
        merges: pf.merges || [],
        columns: (pf.columns || []).map((c) => ({
          ...c,
          color: c.color ?? null,
        })),
        rows: (pf.rows || []).map((r) => ({
          ...r,
          cells: Object.fromEntries(
            Object.entries(r.cells || {}).map(([k, v]) => [k, normalizeCell(v)]),
          ),
        })),
      })),
    }
  } catch {
    return structuredClone(DEFAULT_STORE)
  }
}

export function saveLocalStore(store: AppStore): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getClientCredentials(): StoredCredentials {
  try {
    const raw = localStorage.getItem(CREDS_KEY)
    if (raw) return JSON.parse(raw) as StoredCredentials
  } catch {
    /* use defaults */
  }
  return {
    username: import.meta.env.VITE_ADMIN_USERNAME || 'admin',
    password: import.meta.env.VITE_ADMIN_PASSWORD || 'Proforma2026!',
  }
}

export function saveClientCredentials(creds: StoredCredentials): void {
  localStorage.setItem(CREDS_KEY, JSON.stringify(creds))
}

export function isServerApiEnabled(): boolean {
  return import.meta.env.VITE_USE_API === 'true'
}

/** Normalize legacy columns missing `color` */
export function normalizeColumn(col: Column): Column {
  return { ...col, color: col.color ?? null }
}

