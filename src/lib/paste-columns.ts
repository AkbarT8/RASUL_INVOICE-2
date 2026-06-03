import type { Row } from '../../shared/types'
import { normalizeCell } from './cell-format'

export function parseClipboardGrid(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
  return lines.map((line) => line.split('\t'))
}

export function buildPasteUpdates(
  text: string,
  orderedColIds: string[],
  rows: Row[],
  startRowIndex = 0,
): { rowId: string; colId: string; value: string }[] {
  const updates: { rowId: string; colId: string; value: string }[] = []
  if (!orderedColIds.length) return updates

  if (orderedColIds.length === 1) {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
    while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()
    lines.forEach((line, ri) => {
      const row = rows[startRowIndex + ri]
      if (!row) return
      updates.push({ rowId: row.id, colId: orderedColIds[0], value: line })
    })
    return updates
  }

  const grid = parseClipboardGrid(text)
  grid.forEach((line, ri) => {
    const row = rows[startRowIndex + ri]
    if (!row) return
    line.forEach((value, ci) => {
      if (ci >= orderedColIds.length) return
      updates.push({ rowId: row.id, colId: orderedColIds[ci], value })
    })
  })
  return updates
}

export function applyPasteUpdates(
  rows: Row[],
  updates: { rowId: string; colId: string; value: string }[],
): Row[] {
  if (!updates.length) return rows
  const byRow = new Map<string, Map<string, string>>()
  for (const u of updates) {
    if (!byRow.has(u.rowId)) byRow.set(u.rowId, new Map())
    byRow.get(u.rowId)!.set(u.colId, u.value)
  }
  return rows.map((r) => {
    const patch = byRow.get(r.id)
    if (!patch) return r
    const cells = { ...r.cells }
    for (const [colId, value] of patch) {
      cells[colId] = { ...normalizeCell(cells[colId]), value }
    }
    return { ...r, cells }
  })
}
