import type { Column, MergedRegion } from '../../shared/types'
import { columnLetter } from './spreadsheet-labels'

export interface ColumnHeaderLayout {
  hidden: boolean
  colSpan: number
  letter: string
  width: number
}

/** Merge letter headers when data merge spans multiple columns (Excel-style). */
export function getColumnHeaderLayout(
  colId: string,
  colIndex: number,
  columns: Column[],
  merges: MergedRegion[] | undefined,
): ColumnHeaderLayout {
  const col = columns[colIndex]
  const baseWidth = col?.width ?? 120

  const multiColMerges =
    merges?.filter((m) => m.colIds.length > 1 && m.colIds.includes(colId)) ?? []

  if (multiColMerges.length > 0) {
    const m = multiColMerges[0]
    const order = columns.map((c) => c.id)
    const sortedIds = [...m.colIds].sort(
      (a, b) => order.indexOf(a) - order.indexOf(b),
    )
    const anchorId = sortedIds[0]
    if (colId !== anchorId) {
      return { hidden: true, colSpan: 1, letter: '', width: 0 }
    }
    const startIndex = order.indexOf(anchorId)
    const width = sortedIds.reduce(
      (sum, id) => sum + (columns.find((c) => c.id === id)?.width ?? 120),
      0,
    )
    return {
      hidden: false,
      colSpan: sortedIds.length,
      letter: columnLetter(startIndex),
      width,
    }
  }

  return {
    hidden: false,
    colSpan: 1,
    letter: columnLetter(colIndex),
    width: baseWidth,
  }
}


export function getMergedColumnGroup(
  colId: string,
  columns: Column[],
  merges: MergedRegion[] | undefined,
): string[] {
  const order = columns.map((c) => c.id)
  const multi = merges?.find((m) => m.colIds.length > 1 && m.colIds.includes(colId))
  if (!multi) return [colId]
  return [...multi.colIds].sort((a, b) => order.indexOf(a) - order.indexOf(b))
}
