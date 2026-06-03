import ExcelJS from 'exceljs'
import type { CellColor, Column, Proforma, Row } from '../../shared/types'

const COLOR_MAP: Record<NonNullable<CellColor>, string> = {
  green: 'FFDCFCE7',
  red: 'FFFEE2E2',
  yellow: 'FFFEF9C3',
  blue: 'FFDBEAFE',
  orange: 'FFFFEDD5',
  purple: 'FFF3E8FF',
}

function applyCellStyle(
  cell: ExcelJS.Cell,
  color: CellColor,
  bold = false,
) {
  cell.font = { name: 'Inter', size: 10, bold }
  cell.alignment = { vertical: 'middle', wrapText: true }
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFE4E4E7' } },
    left: { style: 'thin', color: { argb: 'FFE4E4E7' } },
    bottom: { style: 'thin', color: { argb: 'FFE4E4E7' } },
    right: { style: 'thin', color: { argb: 'FFE4E4E7' } },
  }
  if (color) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_MAP[color] },
    }
  }
}

export async function exportProformaToExcel(
  proforma: Proforma,
  options: {
    rowIds?: string[]
    columnIds?: string[]
    filename?: string
  } = {},
) {
  const columns = proforma.columns
    .filter((c) => !c.hidden)
    .filter((c) => !options.columnIds || options.columnIds.includes(c.id))
    .sort((a, b) => a.order - b.order)

  const rows = proforma.rows
    .filter((r) => !options.rowIds || options.rowIds.includes(r.id))
    .sort((a, b) => a.order - b.order)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Proforma Workspace'
  const sheet = workbook.addWorksheet(proforma.number || 'Proforma', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.columns = columns.map((col) => ({
    header: col.name,
    key: col.id,
    width: Math.max(12, Math.round(col.width / 8)),
  }))

  const headerRow = sheet.getRow(1)
  headerRow.height = 22
  columns.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = col.name
    applyCellStyle(cell, null, true)
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF4F4F5' },
    }
  })

  rows.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(rowIndex + 2)
    excelRow.height = 20
    columns.forEach((col, colIndex) => {
      const data = row.cells[col.id]
      const cell = excelRow.getCell(colIndex + 1)
      cell.value = data?.value ?? ''
      applyCellStyle(cell, data?.color ?? null)
    })
  })

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download =
    options.filename ||
    `${proforma.number || 'proforma'}_${new Date().toISOString().slice(0, 10)}.xlsx`
  a.click()
  URL.revokeObjectURL(url)
}

export function getVisibleColumns(columns: Column[]) {
  return columns.filter((c) => !c.hidden).sort((a, b) => a.order - b.order)
}

export function getSortedRows(rows: Row[]) {
  return [...rows].sort((a, b) => a.order - b.order)
}
