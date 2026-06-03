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
  const deleteProforma = useAppStore((s) => s.deleteProforma)

  const client = store.clients.find((c) => c.id === clientId)
  const proformas = store.proformas.filter((p) => p.clientId === clientId)

  if (!client) {
    return (
      <div className="p-6">
        <p className="text-[#71717a]">Client not found.</p>
        <Link to="/clients" className="mt-2 text-violet-400">
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
      <header className="shrink-0 border-b border-[#1f1f27] px-6 py-4">
        <Link
          to="/clients"
          className="mb-3 inline-flex items-center gap-1 text-[12px] text-[#71717a] hover:text-white"
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
                  <label className="text-[10px] uppercase tracking-wide text-[#52525b]">
                    {label}
                  </label>
                  <input
                    value={client[field]}
                    onChange={(e) =>
                      updateClient(client.id, { [field]: e.target.value })
                    }
                    className="mt-0.5 w-full rounded border border-transparent bg-[#0f0f12] px-2 py-1.5 text-[13px] outline-none focus:border-[#3f3f46]"
                  />
                </div>
              ))}
            </div>
            <textarea
              value={client.notes}
              onChange={(e) => updateClient(client.id, { notes: e.target.value })}
              placeholder="Notes"
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border border-[#1f1f27] bg-[#0f0f12] px-3 py-2 text-[13px] outline-none focus:border-[#3f3f46]"
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
          <h3 className="text-[13px] font-medium text-[#a1a1aa]">Proformas</h3>
          <button
            type="button"
            onClick={handleNewProforma}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-[12px] text-white hover:bg-violet-500"
          >
            <Plus className="h-3.5 w-3.5" />
            New proforma
          </button>
        </div>

        {proformas.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#27272f] py-16 text-[#52525b]">
            <FileSpreadsheet className="mb-2 h-8 w-8 opacity-40" />
            <p>No proformas in this folder yet.</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {proformas.map((pf) => (
              <div
                key={pf.id}
                className="group flex items-center justify-between rounded-xl border border-[#1f1f27] bg-[#0c0c0f] px-4 py-3 transition hover:border-[#3f3f46]"
              >
                <Link
                  to={`/clients/${client.id}/proformas/${pf.id}`}
                  className="min-w-0 flex-1"
                >
                  <p className="font-medium text-white group-hover:text-violet-300">
                    {pf.number}
                  </p>
                  <p className="text-[11px] text-[#52525b]">
                    {formatDate(pf.date)} · {pf.status} · {pf.rows.length} rows
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Delete this proforma?')) deleteProforma(pf.id)
                  }}
                  className="rounded p-1.5 text-[#52525b] opacity-0 transition hover:text-red-400 group-hover:opacity-100"
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
