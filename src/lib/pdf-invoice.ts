import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { Client, Proforma } from '../../shared/types'
import { normalizeColor } from './colors'
import { getSortedRows, getVisibleColumns } from './excel-utils'
import { isHiddenByMerge, normalizeCell } from './cell-format'
import { displayColumnTitle } from './spreadsheet-labels'

export interface InvoicePdfOptions {
  companyName: string
  invoiceNumber: string
  date: string
  status: string
  currency: string
  footer: string
  billToName: string
  billToCompany: string
  billToCountry: string
  billToPhone: string
  filename: string
  rowIds?: string[]
  columnIds?: string[]
}

function hexToRgb(hex: string): [number, number, number] | null {
  const n = normalizeColor(hex)
  if (!n || !n.startsWith('#') || n.length < 7) return null
  return [
    parseInt(n.slice(1, 3), 16),
    parseInt(n.slice(3, 5), 16),
    parseInt(n.slice(5, 7), 16),
  ]
}

export function downloadInvoicePdf(
  proforma: Proforma,
  _client: Client,
  options: InvoicePdfOptions,
) {
  const columns = getVisibleColumns(proforma.columns).filter(
    (c) => !options.columnIds || options.columnIds.includes(c.id),
  )
  let rows = getSortedRows(proforma.rows).filter(
    (r) => !options.rowIds || options.rowIds.includes(r.id),
  )

  const doc = new jsPDF({ orientation: columns.length > 5 ? 'landscape' : 'portrait' })
  const pageW = doc.internal.pageSize.getWidth()

  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', pageW / 2, 18, { align: 'center' })

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  let y = 32
  doc.setFont('helvetica', 'bold')
  doc.text(options.companyName, 14, y)
  doc.setFont('helvetica', 'normal')
  y += 5
  doc.text(`Invoice #: ${options.invoiceNumber}`, 14, y)
  y += 5
  doc.text(`Date: ${options.date}`, 14, y)
  y += 5
  doc.text(`Status: ${options.status}`, 14, y)

  let y2 = 32
  doc.setFont('helvetica', 'bold')
  doc.text('Bill to:', pageW / 2 + 10, y2)
  doc.setFont('helvetica', 'normal')
  y2 += 5
  doc.text(options.billToName, pageW / 2 + 10, y2)
  y2 += 5
  if (options.billToCompany) doc.text(options.billToCompany, pageW / 2 + 10, y2)
  y2 += 5
  if (options.billToCountry) doc.text(options.billToCountry, pageW / 2 + 10, y2)
  y2 += 5
  if (options.billToPhone) doc.text(options.billToPhone, pageW / 2 + 10, y2)

  const headerRow = rows[0]
  const head = [
    columns.map((c, i) =>
      displayColumnTitle(i, headerRow?.cells[c.id]?.value, c.name),
    ),
  ]
  const body = rows.map((row) =>
    columns.map((col) => {
      if (isHiddenByMerge(proforma.merges, row.id, col.id)) return ''
      return normalizeCell(row.cells[col.id]).value || ''
    }),
  )

  autoTable(doc, {
    startY: Math.max(y, y2) + 10,
    head,
    body,
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [241, 245, 249], textColor: [30, 41, 59] },
    didParseCell: (data) => {
      if (data.section === 'body' && data.row.index >= 0) {
        const row = rows[data.row.index]
        const col = columns[data.column.index]
        if (row && col) {
          const cell = normalizeCell(row.cells[col.id])
          if (cell.bold) data.cell.styles.fontStyle = 'bold'
          if (cell.align === 'center') data.cell.styles.halign = 'center'
          else if (cell.align === 'right') data.cell.styles.halign = 'right'
          const fill = cell.color ?? col.color
          const rgb = fill ? hexToRgb(fill) : null
          if (rgb) data.cell.styles.fillColor = rgb
        }
      }
    },
  })

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 200
  if (options.footer) {
    doc.setFontSize(9)
    doc.text(options.footer, 14, finalY + 8)
  }
  if (options.currency) {
    doc.text(`Currency: ${options.currency}`, 14, finalY + 14)
  }

  const name = options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`
  doc.save(name)
}
