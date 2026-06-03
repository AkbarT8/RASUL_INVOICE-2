import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, FileSpreadsheet, Users } from 'lucide-react'
import { useAppStore } from '../store/useAppStore'

export function DashboardPage() {
  const { clients, proformas } = useAppStore((s) => s.store)

  const stats = [
    { label: 'Clients', value: clients.length, icon: Users },
    { label: 'Proformas', value: proformas.length, icon: FileSpreadsheet },
  ]

  const recent = [...proformas]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6)

  return (
    <div className="flex h-full flex-col overflow-auto">
      <header className="border-b border-[slate-200] px-6 py-5">
        <h2 className="text-[18px] font-semibold tracking-tight">Dashboard</h2>
        <p className="mt-1 text-[13px] text-[text-slate-500]">
          Your private proforma workspace
        </p>
      </header>

      <div className="space-y-6 p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="rounded-xl border border-[slate-200] bg-[white] p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-[text-slate-500]">{stat.label}</p>
                <stat.icon className="h-4 w-4 text-violet-600/80" />
              </div>
              <p className="mt-2 text-[28px] font-semibold tabular-nums">
                {stat.value}
              </p>
            </motion.div>
          ))}
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[13px] font-medium text-[text-slate-600]">
              Recent proformas
            </h3>
            <Link
              to="/clients"
              className="flex items-center gap-1 text-[12px] text-violet-600 hover:text-violet-700"
            >
              View clients <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-[slate-200]">
            <table className="w-full text-left">
              <thead className="bg-[white] text-[11px] uppercase tracking-wide text-[text-slate-400]">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Number</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-4 py-2.5 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-8 text-center text-[text-slate-400]">
                      No proformas yet. Open a client to create one.
                    </td>
                  </tr>
                ) : (
                  recent.map((pf) => {
                    const client = clients.find((c) => c.id === pf.clientId)
                    return (
                      <tr
                        key={pf.id}
                        className="border-t border-[slate-200] transition hover:bg-[white]"
                      >
                        <td className="px-4 py-2.5">
                          <Link
                            to={`/clients/${pf.clientId}/proformas/${pf.id}`}
                            className="font-medium text-slate-900 hover:text-violet-700"
                          >
                            {pf.number}
                          </Link>
                          <p className="text-[11px] text-[text-slate-400]">
                            {client?.name}
                          </p>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="rounded-full bg-[violet-50] px-2 py-0.5 text-[11px]">
                            {pf.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-[12px] text-[text-slate-500]">
                          {new Date(pf.updatedAt).toLocaleString()}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  )
}
