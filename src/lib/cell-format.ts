import type { Cell, CellFormat, MergedRegion, Proforma, Row } from '../../shared/types'

export function cellKey(rowId: string, colId: string) {
  return `${rowId}:${colId}`
}

export function parseCellKey(key: string) {
  const i = key.indexOf(':')
  return { rowId: key.slice(0, i), colId: key.slice(i + 1) }
}

export function emptyCell(): Cell {
  return { value: '', type: 'text', color: null, align: 'left' }
}

export function normalizeCell(cell?: Partial<Cell> | null): Cell {
  if (!cell) return emptyCell()
  return {
    value: cell.value ?? '',
    type: cell.type ?? 'text',
    color: cell.color ?? null,
    bold: cell.bold ?? false,
    italic: cell.italic ?? false,
    underline: cell.underline ?? false,
    align: cell.align ?? 'left',
  }
}

export function cellStyleClasses(cell: Cell, extra?: string) {
  const parts = [extra]
  if (cell.bold) parts.push('font-semibold')
  if (cell.italic) parts.push('italic')
  if (cell.underline) parts.push('underline')
  if (cell.align === 'center') parts.push('text-center')
  else if (cell.align === 'right') parts.push('text-right')
  else parts.push('text-left')
  return parts.filter(Boolean).join(' ')
}

export function applyFormatToCell(cell: Cell, format: Partial<CellFormat>): Cell {
  return {
    ...cell,
    bold: format.bold ?? cell.bold,
    italic: format.italic ?? cell.italic,
    underline: format.underline ?? cell.underline,
    align: format.align ?? cell.align,
  }
}

export function applyFormatPatch(cell: Cell, patch: Partial<CellFormat>): Cell {
  const next = { ...cell }
  if (patch.bold !== undefined) next.bold = patch.bold
  if (patch.italic !== undefined) next.italic = patch.italic
  if (patch.underline !== undefined) next.underline = patch.underline
  if (patch.align !== undefined) next.align = patch.align
  return next
}

export function toggleFormat(cell: Cell, key: keyof CellFormat): Cell {
  if (key === 'align') return cell
  return { ...cell, [key]: !cell[key] }
}

export function getMergeAt(
  merges: MergedRegion[] | undefined,
  rowId: string,
  colId: string,
): MergedRegion | undefined {
  return merges?.find((m) => m.rowIds.includes(rowId) && m.colIds.includes(colId))
}

export function isMergeAnchor(m: MergedRegion, rowId: string, colId: string) {
  return m.anchorRowId === rowId && m.anchorColId === colId
}

export function isHiddenByMerge(
  merges: MergedRegion[] | undefined,
  rowId: string,
  colId: string,
): boolean {
  const m = getMergeAt(merges, rowId, colId)
  if (!m) return false
  return !isMergeAnchor(m, rowId, colId)
}

export function collectTargetCellKeys(
  _proforma: Proforma,
  visibleColIds: string[],
  sortedRows: Row[],
  selectedCells: Set<string>,
  selectedRows: Set<string>,
  selectedCols: Set<string>,
): string[] {
  if (selectedCells.size > 0) return [...selectedCells]

  const keys: string[] = []
  const rowList =
    selectedRows.size > 0
      ? sortedRows.filter((r) => selectedRows.has(r.id))
      : sortedRows
  const colList =
    selectedCols.size > 0
      ? visibleColIds.filter((id) => selectedCols.has(id))
      : visibleColIds

  for (const row of rowList) {
    for (const colId of colList) {
      keys.push(cellKey(row.id, colId))
    }
  }
  return keys
}

export function createMergeFromCells(
  _proforma: Proforma,
  cellKeys: string[],
  visibleRows: Row[],
  visibleCols: { id: string }[],
): MergedRegion | null {
  if (cellKeys.length < 2) return null
  const parsed = cellKeys.map(parseCellKey)
  const rowOrder = new Map(visibleRows.map((r, i) => [r.id, i]))
  const colOrder = new Map(visibleCols.map((c, i) => [c.id, i]))
  const rowIds = [...new Set(parsed.map((p) => p.rowId))].sort(
    (a, b) => (rowOrder.get(a) ?? 0) - (rowOrder.get(b) ?? 0),
  )
  const colIds = [...new Set(parsed.map((p) => p.colId))].sort(
    (a, b) => (colOrder.get(a) ?? 0) - (colOrder.get(b) ?? 0),
  )
  const anchorRowId = rowIds[0]
  const anchorColId = colIds[0]
  return {
    id: `merge_${Date.now()}`,
    rowIds,
    colIds,
    anchorRowId,
    anchorColId,
  }
}
