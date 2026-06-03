import type { Cell, Column, Proforma, Row } from '../../shared/types'
import { emptyCell } from './cell-format'
import { uid } from './utils'

export const GRID_MIN_ROWS = 1000
export const GRID_MIN_COLS = 26

export function ensureGridSize(
  proforma: Proforma,
  defaultColumnWidth: number,
): Proforma | null {
  let changed = false
  let columns = [...proforma.columns]
  let rows = [...proforma.rows]

  const visibleCount = columns.filter((c) => !c.hidden).length
  if (columns.length < GRID_MIN_COLS) {
    const start = columns.length
    const newCols: Column[] = []
    for (let i = 0; i < GRID_MIN_COLS - start; i++) {
      newCols.push({
        id: uid('col'),
        name: '',
        width: defaultColumnWidth,
        hidden: false,
        order: start + i,
        color: null,
      })
    }
    columns = [...columns, ...newCols]
    changed = true
  }

  if (rows.length < GRID_MIN_ROWS) {
    const base = rows.length
    const colIds = columns.map((c) => c.id)
    const newRows: Row[] = []
    for (let i = 0; i < GRID_MIN_ROWS - base; i++) {
      const cells: Record<string, Cell> = {}
      colIds.forEach((id) => {
        cells[id] = emptyCell()
      })
      newRows.push({ id: uid('row'), cells, order: base + i })
    }
    rows = [...rows, ...newRows]
    changed = true
  }

  if (changed && rows.length > 0) {
    const colIds = columns.map((c) => c.id)
    rows = rows.map((r) => {
      const cells = { ...r.cells }
      let rowChanged = false
      for (const id of colIds) {
        if (!cells[id]) {
          cells[id] = emptyCell()
          rowChanged = true
        }
      }
      return rowChanged ? { ...r, cells } : r
    })
  }

  if (!changed) return null
  void visibleCount
  return { ...proforma, columns, rows }
}
