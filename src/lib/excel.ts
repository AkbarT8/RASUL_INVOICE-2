import ExcelJS from 'exceljs'
import type { Client, Column, Proforma, Row } from '../../shared/types'
import { colorToExcelArgb, normalizeColor } from './colors'

function applyCellStyle(cell: ExcelJS.Cell, color: string | null, bold = false) {
  cell.font = { name: 'Calibri', size: 10, bold }
  cell.alignment = { vertical: 'middle', wrapText: true }
  cell.border = {
    top: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    left: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    bottom: { style: 'thin', color: { argb: 'FFD0D0D0' } },
    right: { style: 'thin', color: { argb: 'FFD0D0D0' } },
  }
  const argb = colorToExcelArgb(color)
  if (argb) {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } }
  }
}

async function downloadWorkbook(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function buildSheet(
  sheet: ExcelJS.Worksheet,
  columns: Column[],
  rows: Row[],
) {
  columns.forEach((col, i) => {
    const cell = sheet.getCell(1, i + 1)
    cell.value = col.name
    applyCellStyle(cell, normalizeColor(col.color), true)
    sheet.getColumn(i + 1).width = Math.max(10, Math.round(col.width / 7))
  })

  rows.forEach((row, ri) => {
    columns.forEach((col, ci) => {
      const data = row.cells[col.id]
      const cell = sheet.getCell(ri + 2, ci + 1)
      cell.value = data?.value ?? ''
      applyCellStyle(cell, normalizeColor(data?.color ?? col.color))
    })
  })
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
  const sheet = workbook.addWorksheet(proforma.number || 'Proforma', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })
  buildSheet(sheet, columns, rows)
  await downloadWorkbook(
    workbook,
    options.filename ||
      `${proforma.number || 'proforma'}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}

export async function exportProformaAsInvoice(
  proforma: Proforma,
  client: Client,
  options: {
    companyName?: string
    footer?: string
    currency?: string
    rowIds?: string[]
    columnIds?: string[]
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
  const sheet = workbook.addWorksheet('Invoice')

  sheet.mergeCells('A1', 'F1')
  const title = sheet.getCell('A1')
  title.value = 'INVOICE'
  title.font = { size: 18, bold: true }
  title.alignment = { horizontal: 'center' }

  sheet.getCell('A3').value = options.companyName || 'Proforma Workspace'
  sheet.getCell('A3').font = { bold: true }
  sheet.getCell('A4').value = `Invoice #: ${proforma.number}`
  sheet.getCell('A5').value = `Date: ${proforma.date}`
  sheet.getCell('A6').value = `Status: ${proforma.status}`

  sheet.getCell('D3').value = 'Bill to:'
  sheet.getCell('D3').font = { bold: true }
  sheet.getCell('D4').value = client.name
  sheet.getCell('D5').value = client.company
  sheet.getCell('D6').value = client.country
  sheet.getCell('D7').value = client.phone

  const startRow = 10
  columns.forEach((col, i) => {
    const cell = sheet.getCell(startRow, i + 1)
    cell.value = col.name
    applyCellStyle(cell, normalizeColor(col.color), true)
  })

  rows.forEach((row, ri) => {
    columns.forEach((col, ci) => {
      const data = row.cells[col.id]
      const cell = sheet.getCell(startRow + 1 + ri, ci + 1)
      cell.value = data?.value ?? ''
      applyCellStyle(cell, normalizeColor(data?.color ?? col.color))
    })
  })

  const footerRow = startRow + rows.length + 2
  if (options.footer) {
    sheet.getCell(`A${footerRow}`).value = options.footer
  }
  if (options.currency) {
    sheet.getCell(`A${footerRow + 1}`).value = `Currency: ${options.currency}`
  }

  await downloadWorkbook(
    workbook,
    `Invoice_${proforma.number}_${new Date().toISOString().slice(0, 10)}.xlsx`,
  )
}

export { getVisibleColumns, getSortedRows } from './excel-utils'
