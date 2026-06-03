import type { Column, Row } from '../../shared/types'

export function getVisibleColumns(columns: Column[]) {
  return columns.filter((c) => !c.hidden).sort((a, b) => a.order - b.order)
}

export function getSortedRows(rows: Row[]) {
  return [...rows].sort((a, b) => a.order - b.order)
}
