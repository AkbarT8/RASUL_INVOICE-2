export type CellType = 'text' | 'number' | 'date' | 'status' | 'notes'
export type CellColor = string | null
export type CellAlign = 'left' | 'center' | 'right'

export interface CellFormat {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: CellAlign
}

export interface Cell {
  value: string
  type: CellType
  color: CellColor
  bold?: boolean
  italic?: boolean
  underline?: boolean
  align?: CellAlign
}

export interface MergedRegion {
  id: string
  rowIds: string[]
  colIds: string[]
  anchorRowId: string
  anchorColId: string
}

export interface Column {
  id: string
  name: string
  width: number
  hidden: boolean
  order: number
  color: CellColor
}

export interface Row {
  id: string
  cells: Record<string, Cell>
  order: number
}

export interface Proforma {
  id: string
  clientId: string
  number: string
  date: string
  status: string
  notes: string
  columns: Column[]
  rows: Row[]
  merges?: MergedRegion[]
  createdAt: string
  updatedAt: string
}

export interface Client {
  id: string
  name: string
  company: string
  phone: string
  country: string
  notes: string
  createdAt: string
}

export interface AppSettings {
  defaultStatus: string
  defaultColumnWidth: number
  compactTable: boolean
  confirmDeletes: boolean
  proformaPrefix: string
  currencySymbol: string
  defaultRowsToAdd: number
  defaultColsToAdd: number
  autoSaveMs: number
  showGridLines: boolean
  invoiceCompanyName: string
  invoiceFooter: string
  dateFormat: 'eu' | 'us' | 'iso'
}

export interface AppStore {
  clients: Client[]
  proformas: Proforma[]
  settings: AppSettings
}

export interface SearchResult {
  type: 'client' | 'proforma' | 'article' | 'note'
  id: string
  clientId?: string
  proformaId?: string
  title: string
  subtitle: string
  snippet: string
}
