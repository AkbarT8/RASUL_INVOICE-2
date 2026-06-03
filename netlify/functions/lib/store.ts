import { promises as fs } from 'fs'
import path from 'path'
import type { AppStore } from '../../../shared/types'

const DEFAULT_STORE: AppStore = {
  clients: [],
  proformas: [],
  settings: { defaultStatus: 'Draft' },
}

const DATA_DIR = path.join(process.cwd(), '.data')
const DATA_FILE = path.join(DATA_DIR, 'app-store.json')

async function readFileStore(): Promise<AppStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    return { ...DEFAULT_STORE, ...JSON.parse(raw) }
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
    await fs.writeFile(DATA_FILE, JSON.stringify(DEFAULT_STORE, null, 2))
    return structuredClone(DEFAULT_STORE)
  }
}

async function writeFileStore(store: AppStore): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2))
}

async function readBlobStore(): Promise<AppStore> {
  try {
    const { getStore } = await import('@netlify/blobs')
    const store = getStore('proforma-data')
    const data = await store.get('app-store', { type: 'json' })
    if (!data) return structuredClone(DEFAULT_STORE)
    return { ...DEFAULT_STORE, ...(data as AppStore) }
  } catch {
    return readFileStore()
  }
}

async function writeBlobStore(store: AppStore): Promise<void> {
  try {
    const { getStore } = await import('@netlify/blobs')
    const blobStore = getStore('proforma-data')
    await blobStore.setJSON('app-store', store)
  } catch {
    await writeFileStore(store)
  }
}

export async function loadStore(): Promise<AppStore> {
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return readBlobStore()
  }
  return readFileStore()
}

export async function saveStore(store: AppStore): Promise<void> {
  if (process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    await writeBlobStore(store)
    return
  }
  await writeFileStore(store)
}
