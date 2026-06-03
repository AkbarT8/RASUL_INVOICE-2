import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Grid2x2, List, Plus, Building2 } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'
import { cn } from '../lib/utils'

export function ClientsPage() {
  const clients = useAppStore((s) => s.store.clients)
  const addClient = useAppStore((s) => s.addClient)
  const [view, setView] = useState<'cards' | 'table'>('cards')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    country: '',
    notes: '',
  })

  function handleCreate() {
    if (!form.name.trim()) return
    addClient({
      name: form.name.trim(),
      company: form.company.trim(),
      phone: form.phone.trim(),
      country: form.country.trim(),
      notes: form.notes.trim(),
    })
    setForm({ name: '', company: '', phone: '', country: '', notes: '' })
    setShowForm(false)
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <header className="flex shrink-0 items-center justify-between border-b border-[slate-200] px-6 py-4">
        <div>
          <h2 className="text-[18px] font-semibold tracking-tight">Clients</h2>
          <p className="text-[12px] text-[text-slate-500]">{clients.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[slate-200] p-0.5">
            <button
              type="button"
              onClick={() => setView('cards')}
              className={cn(
                'rounded-md p-1.5',
                view === 'cards' ? 'bg-[violet-50] text-slate-900' : 'text-[text-slate-500]',
              )}
            >
              <Grid2x2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={cn(
                'rounded-md p-1.5',
                view === 'table' ? 'bg-[violet-50] text-slate-900' : 'text-[text-slate-500]',
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-[12px] font-medium text-slate-900 hover:bg-violet-500"
          >
            <Plus className="h-3.5 w-3.5" />
            New client
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-auto p-6">
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden rounded-xl border border-violet-500/20 bg-[white] p-4"
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {(['name', 'company', 'phone', 'country'] as const).map((field) => (
                  <input
                    key={field}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="rounded-lg border border-[slate-200] bg-[slate-50] px-3 py-2 text-[13px] outline-none focus:border-violet-500/50"
                  />
                ))}
                <input
                  placeholder="Notes"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="rounded-lg border border-[slate-200] bg-[slate-50] px-3 py-2 text-[13px] outline-none focus:border-violet-500/50 sm:col-span-2"
                />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  className="rounded-lg bg-violet-600 px-4 py-2 text-[12px] text-slate-900"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg px-4 py-2 text-[12px] text-[text-slate-500] hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {clients.length === 0 ? (
          <p className="text-center text-[text-slate-400]">No clients yet.</p>
        ) : view === 'cards' ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {clients.map((client, i) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Link
                  to={`/clients/${client.id}`}
                  className="group block rounded-xl border border-[slate-200] bg-[white] p-4 transition hover:border-[#3f3f46] hover:bg-[white]"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900 group-hover:text-violet-700">
                        {client.name}
                      </h3>
                      <p className="mt-0.5 flex items-center gap-1 text-[12px] text-[text-slate-500]">
                        <Building2 className="h-3 w-3" />
                        {client.company || '—'}
                      </p>
                    </div>
                  </div>
                  <p className="mt-3 text-[11px] text-[text-slate-400]">
                    {client.country || 'No country'} · {client.phone || 'No phone'}
                  </p>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[slate-200]">
            <table className="w-full text-left">
              <thead className="bg-[white] text-[11px] uppercase tracking-wide text-[text-slate-400]">
                <tr>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Company</th>
                  <th className="px-4 py-2.5">Phone</th>
                  <th className="px-4 py-2.5">Country</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-t border-[slate-200] transition hover:bg-[white]"
                  >
                    <td className="px-4 py-2.5">
                      <Link
                        to={`/clients/${client.id}`}
                        className="font-medium hover:text-violet-700"
                      >
                        {client.name}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-[text-slate-600]">{client.company}</td>
                    <td className="px-4 py-2.5 text-[text-slate-600]">{client.phone}</td>
                    <td className="px-4 py-2.5 text-[text-slate-600]">{client.country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
