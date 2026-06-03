import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { Spreadsheet } from '../components/spreadsheet/Spreadsheet'
import type { Proforma } from '../../shared/types'
import { ui } from '../lib/theme'

export function ProformaWorkspacePage() {
  const { clientId, proformaId } = useParams()
  const navigate = useNavigate()
  const store = useAppStore((s) => s.store)
  const updateProforma = useAppStore((s) => s.updateProforma)
  const addProforma = useAppStore((s) => s.addProforma)
  const setSelectedClient = useAppStore((s) => s.setSelectedClient)
  const setSelectedProforma = useAppStore((s) => s.setSelectedProforma)

  const client = store.clients.find((c) => c.id === clientId)
  const proforma = store.proformas.find((p) => p.id === proformaId)

  useEffect(() => {
    if (clientId) setSelectedClient(clientId)
    if (proformaId) setSelectedProforma(proformaId)
  }, [clientId, proformaId, setSelectedClient, setSelectedProforma])

  if (!client || !proforma) {
    return (
      <div className="p-6 text-slate-500">
        Proforma not found.{' '}
        <Link to="/clients" className="text-violet-600 hover:underline">
          Back
        </Link>
      </div>
    )
  }

  function handleChange(next: Proforma) {
    updateProforma(proforma!.id, next)
  }

  function handleCreateProforma() {
    if (!client) return
    const pf = addProforma(client.id)
    navigate(`/clients/${client.id}/proformas/${pf.id}`)
  }

  const compact = store.settings.compactTable

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className={`shrink-0 border-b ${ui.border} bg-white px-4 py-3`}>
        <Link
          to={`/clients/${client.id}`}
          className="mb-2 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-900"
        >
          <ChevronLeft className="h-3 w-3" />
          {client.name}
        </Link>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="text-[10px] font-medium uppercase text-slate-400">
              Number
            </label>
            <input
              value={proforma.number}
              onChange={(e) => handleChange({ ...proforma, number: e.target.value })}
              className="block bg-transparent text-[17px] font-semibold text-slate-900 outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase text-slate-400">Date</label>
            <input
              type="date"
              value={proforma.date}
              onChange={(e) => handleChange({ ...proforma, date: e.target.value })}
              className={`mt-0.5 block ${ui.input} py-1`}
            />
          </div>
          <div>
            <label className="text-[10px] font-medium uppercase text-slate-400">
              Status
            </label>
            <input
              value={proforma.status}
              onChange={(e) => handleChange({ ...proforma, status: e.target.value })}
              className={`mt-0.5 block ${ui.input} py-1`}
            />
          </div>
          <div className="min-w-[200px] flex-1">
            <label className="text-[10px] font-medium uppercase text-slate-400">Notes</label>
            <input
              value={proforma.notes}
              onChange={(e) => handleChange({ ...proforma, notes: e.target.value })}
              className={`mt-0.5 block w-full ${ui.input} py-1`}
            />
          </div>
        </div>
      </header>
      <div className="min-h-0 flex-1">
        <Spreadsheet
          proforma={proforma}
          onChange={handleChange}
          compact={compact}
          confirmDeletes={store.settings.confirmDeletes}
          defaultColumnWidth={store.settings.defaultColumnWidth}
          onCreateProforma={handleCreateProforma}
        />
      </div>
    </div>
  )
}
