import { useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, FileSpreadsheet, Plus, Trash2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { formatDate } from '../lib/utils'

export function ClientDetailPage() {
  const { clientId } = useParams()
  const navigate = useNavigate()
  const store = useAppStore((s) => s.store)
  const updateClient = useAppStore((s) => s.updateClient)
  const deleteClient = useAppStore((s) => s.deleteClient)
  const addProforma = useAppStore((s) => s.addProforma)
  const pinClient = useAppStore((s) => s.pinClient)
  const deleteProforma = useAppStore((s) => s.deleteProforma)

  const client = store.clients.find((c) => c.id === clientId)
  useEffect(() => {
    if (clientId) pinClient(clientId)
  }, [clientId, pinClient])

  const proformas = store.proformas.filter((p) => p.clientId === clientId)

  if (!client) {
    return (
      <div className="p-6">
        <p className="text-[text-slate-500]">Client not found.</p>
        <Link to="/clients" className="mt-2 text-violet-600">
          Back to clients
        </Link>
      </div>
    )
  }

  function handleNewProforma() {
    if (!client) return
    const pf = addProforma(client.id)
    navigate(`/clients/${client.id}/proformas/${pf.id}`)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="shrink-0 border-b border-[slate-200] px-6 py-4">
        <Link
          to="/clients"
          className="mb-3 inline-flex items-center gap-1 text-[12px] text-[text-slate-500] hover:text-slate-900"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Clients
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <input
              value={client.name}
              onChange={(e) => updateClient(client.id, { name: e.target.value })}
              className="w-full bg-transparent text-[20px] font-semibold tracking-tight outline-none"
            />
            <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {(
                [
                  ['company', 'Company'],
                  ['phone', 'Phone'],
                  ['country', 'Country'],
                ] as const
              ).map(([field, label]) => (
                <div key={field}>
                  <label className="text-[10px] uppercase tracking-wide text-[text-slate-400]">
                    {label}
                  </label>
                  <input
                    value={client[field]}
                    onChange={(e) =>
                      updateClient(client.id, { [field]: e.target.value })
                    }
                    className="mt-0.5 w-full rounded border border-transparent bg-[white] px-2 py-1.5 text-[13px] outline-none focus:border-[#3f3f46]"
                  />
                </div>
              ))}
            </div>
            <textarea
              value={client.notes}
              onChange={(e) => updateClient(client.id, { notes: e.target.value })}
              placeholder="Notes"
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-[slate-200] bg-[white] px-3 py-2 text-[13px] outline-none focus:border-[#3f3f46]"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete this client and all proformas?')) {
                deleteClient(client.id)
                navigate('/clients')
              }
            }}
            className="rounded-lg border border-red-500/20 p-2 text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-medium text-[text-slate-600]">Proformas</h3>
          <button
            type="button"
            onClick={handleNewProforma}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-[12px] text-slate-900 hover:bg-violet-500"
          >
            <Plus className="h-3.5 w-3.5" />
            New proforma
          </button>
        </div>

        {proformas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[slate-200] py-16 text-[text-slate-400]">
            <FileSpreadsheet className="mb-2 h-8 w-8 opacity-40" />
            <p>No proformas in this folder yet.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {proformas.map((pf) => (
              <div
                key={pf.id}
                className="group flex items-center justify-between rounded-xl border border-[slate-200] bg-[white] px-4 py-3 transition hover:border-[#3f3f46]"
              >
                <Link
                  to={`/clients/${client.id}/proformas/${pf.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="font-medium text-slate-900 group-hover:text-violet-700">
                    {pf.number}
                  </p>
                  <p className="text-[11px] text-[text-slate-400]">
                    {formatDate(pf.date)} · {pf.status} · {pf.rows.length} rows
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete this proforma?')) deleteProforma(pf.id)
                  }}
                  className="rounded p-1.5 text-[text-slate-400] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
