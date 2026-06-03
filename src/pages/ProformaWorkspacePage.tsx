import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Spreadsheet } from '../components/spreadsheet/Spreadsheet'
import type { Proforma } from '../../shared/types'

export function ProformaWorkspacePage() {
  const { clientId, proformaId } = useParams()
  const store = useAppStore((s) => s.store)
  const updateProforma = useAppStore((s) => s.updateProforma)

  const client = store.clients.find((c) => c.id === clientId)
  const proforma = store.proformas.find((p) => p.id === proformaId)

  if (!client || !proforma) {
    return (
      <div className="p-6 text-[#71717a]">
        Proforma not found.{' '}
        <Link to="/clients" className="text-violet-400">
          Back
        </Link>
      </div>
    )
  }

  function handleChange(next: Proforma) {
    if (!proforma) return
    updateProforma(proforma.id, next)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[#1f1f27] px-4 py-3">
        <Link
          to={`/clients/${client.id}`}
          className="mb-2 inline-flex items-center gap-1 text-[11px] text-[#71717a] hover:text-white"
        >
          <ChevronLeft className="h-3 w-3" />
          {client.name}
        </Link>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-[10px] uppercase text-[#52525b]">Number</label>
            <input
              value={proforma.number}
              onChange={(e) => handleChange({ ...proforma, number: e.target.value })}
              className="block bg-transparent text-[17px] font-semibold outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-[#52525b]">Date</label>
            <input
              type="date"
              value={proforma.date}
              onChange={(e) => handleChange({ ...proforma, date: e.target.value })}
              className="block rounded border border-[#27272f] bg-[#0f0f12] px-2 py-1 text-[12px] outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase text-[#52525b]">Status</label>
            <input
              value={proforma.status}
              onChange={(e) => handleChange({ ...proforma, status: e.target.value })}
              className="block rounded border border-[#27272f] bg-[#0f0f12] px-2 py-1 text-[12px] outline-none"
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="text-[10px] uppercase text-[#52525b]">Notes</label>
            <input
              value={proforma.notes}
              onChange={(e) => handleChange({ ...proforma, notes: e.target.value })}
              className="block w-full rounded border border-[#27272f] bg-[#0f0f12] px-2 py-1 text-[12px] outline-none"
            />
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <Spreadsheet proforma={proforma} onChange={handleChange} />
      </div>
    </div>
  )
}
