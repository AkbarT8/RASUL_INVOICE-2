import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import type { Client, Proforma } from '../../../shared/types'
import { downloadInvoicePdf } from '../../lib/pdf-invoice'
import { getSortedRows, getVisibleColumns } from '../../lib/excel-utils'
import { colorStyle } from '../../lib/colors'
import { displayColumnTitle } from '../../lib/spreadsheet-labels'
import { ui } from '../../lib/theme'

export interface InvoiceDraft {
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
}

export function InvoicePreviewModal({
  proforma,
  client,
  initial,
  rowIds,
  columnIds,
  onClose,
}: {
  proforma: Proforma
  client: Client
  initial: Omit<InvoiceDraft, 'filename'> & { filename?: string }
  rowIds?: string[]
  columnIds?: string[]
  onClose: () => void
}) {
  const [draft, setDraft] = useState<InvoiceDraft>({
    companyName: initial.companyName,
    invoiceNumber: initial.invoiceNumber,
    date: initial.date,
    status: initial.status,
    currency: initial.currency,
    footer: initial.footer,
    billToName: initial.billToName,
    billToCompany: initial.billToCompany,
    billToCountry: initial.billToCountry,
    billToPhone: initial.billToPhone,
    filename: initial.filename || `Invoice_${proforma.number}.pdf`,
  })

  const columns = useMemo(() => {
    let cols = getVisibleColumns(proforma.columns)
    if (columnIds?.length) cols = cols.filter((c) => columnIds.includes(c.id))
    return cols
  }, [proforma.columns, columnIds])

  const rows = useMemo(() => {
    let r = getSortedRows(proforma.rows)
    if (rowIds?.length) r = r.filter((row) => rowIds.includes(row.id))
    return r
  }, [proforma.rows, rowIds])

  function field(label: string, key: keyof InvoiceDraft) {
    return (
      <div>
        <label className="text-[11px] font-medium text-slate-500">{label}</label>
        <input
          value={draft[key]}
          onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
          className={`mt-0.5 w-full ${ui.input} py-1.5 text-[12px]`}
        />
      </div>
    )
  }

  function handleDownload() {
    const pf: Proforma = {
      ...proforma,
      number: draft.invoiceNumber,
      date: draft.date,
      status: draft.status,
    }
    const cl: Client = {
      ...client,
      name: draft.billToName,
      company: draft.billToCompany,
      country: draft.billToCountry,
      phone: draft.billToPhone,
    }
    downloadInvoicePdf(pf, cl, {
      companyName: draft.companyName,
      footer: draft.footer,
      currency: draft.currency,
      rowIds,
      columnIds,
      invoiceNumber: draft.invoiceNumber,
      date: draft.date,
      status: draft.status,
      billToName: draft.billToName,
      billToCompany: draft.billToCompany,
      billToCountry: draft.billToCountry,
      billToPhone: draft.billToPhone,
      filename: draft.filename.endsWith('.pdf') ? draft.filename : `${draft.filename}.pdf`,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      <header className={`flex shrink-0 items-center justify-between border-b ${ui.border} px-6 py-4`}>
        <div>
          <h2 className="text-[18px] font-semibold text-slate-900">Create invoice</h2>
          <p className="text-[12px] text-slate-500">Просмотр и правка перед скачиванием PDF</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        <aside className={`w-[320px] shrink-0 overflow-y-auto border-r ${ui.border} bg-slate-50 p-5`}>
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            From (your company)
          </p>
          <div className="space-y-3">
            {field('Company name', 'companyName')}
            {field('Invoice number', 'invoiceNumber')}
            {field('Date', 'date')}
            {field('Status', 'status')}
            {field('Currency', 'currency')}
          </div>
          <p className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Bill to
          </p>
          <div className="space-y-3">
            {field('Client name', 'billToName')}
            {field('Company', 'billToCompany')}
            {field('Country', 'billToCountry')}
            {field('Phone', 'billToPhone')}
          </div>
          <p className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Footer
          </p>
          <textarea
            value={draft.footer}
            onChange={(e) => setDraft({ ...draft, footer: e.target.value })}
            rows={3}
            className={`w-full resize-none ${ui.input} text-[12px]`}
          />
          <p className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            File
          </p>
          {field('Имя файла (.pdf)', 'filename')}
        </aside>

        <main className="min-w-0 flex-1 overflow-auto bg-white p-8">
          <div className={`mx-auto max-w-4xl ${ui.card} p-8`}>
            <h1 className="text-center text-[22px] font-bold tracking-wide text-slate-900">INVOICE</h1>
            <div className="mt-8 grid gap-8 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">From</p>
                <p className="mt-1 font-semibold text-slate-900">{draft.companyName}</p>
                <p className="text-[12px] text-slate-600">#{draft.invoiceNumber}</p>
                <p className="text-[12px] text-slate-600">{draft.date}</p>
                <p className="text-[12px] text-slate-600">{draft.status}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase text-slate-400">Bill to</p>
                <p className="mt-1 font-semibold text-slate-900">{draft.billToName}</p>
                <p className="text-[12px] text-slate-600">{draft.billToCompany}</p>
                <p className="text-[12px] text-slate-600">{draft.billToCountry}</p>
                <p className="text-[12px] text-slate-600">{draft.billToPhone}</p>
              </div>
            </div>
            <div className="mt-8 overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr className="bg-slate-50">
                    {columns.map((col, colIndex) => (
                      <th
                        key={col.id}
                        className="border-b border-slate-200 px-2 py-2 text-left font-semibold text-slate-600"
                        style={colorStyle(col.color)}
                      >
                        {displayColumnTitle(
                          colIndex,
                          rows[0]?.cells[col.id]?.value,
                          col.name,
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                        No line items
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="border-t border-slate-100">
                        {columns.map((col) => {
                          const cell = row.cells[col.id]
                          return (
                            <td
                              key={col.id}
                              className="px-2 py-1.5 text-slate-800"
                              style={colorStyle(cell?.color ?? col.color)}
                            >
                              {cell?.value || '—'}
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {draft.footer && (
              <p className="mt-6 text-[12px] text-slate-500">{draft.footer}</p>
            )}
            {draft.currency && (
              <p className="mt-2 text-[12px] font-medium text-slate-700">
                Currency: {draft.currency}
              </p>
            )}
          </div>
        </main>
      </div>

      <footer className={`flex shrink-0 justify-end gap-2 border-t ${ui.border} bg-slate-50 px-6 py-3`}>
        <button type="button" onClick={onClose} className={ui.btnSecondary}>
          Cancel
        </button>
        <button type="button" onClick={handleDownload} className={ui.btnPrimary}>
          Скачать PDF
        </button>
      </footer>
    </div>
  )
}
