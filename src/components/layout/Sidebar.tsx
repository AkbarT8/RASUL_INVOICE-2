import { NavLink, useParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Search,
  Settings,
  LogOut,
  ChevronRight,
  FileSpreadsheet,
  FolderOpen,
} from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'
import { motion } from 'framer-motion'
import { ui } from '../../lib/theme'

const links = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/clients', icon: Users, label: 'Clients', end: false },
  { to: '/search', icon: Search, label: 'Search', end: true },
  { to: '/settings', icon: Settings, label: 'Settings', end: true },
]

export function Sidebar() {
  const logout = useAppStore((s) => s.logout)
  const username = useAppStore((s) => s.username)
  const saving = useAppStore((s) => s.saving)
  const store = useAppStore((s) => s.store)
  const { clientId, proformaId } = useParams()

  const client = clientId ? store.clients.find((c) => c.id === clientId) : null
  const proforma = proformaId
    ? store.proformas.find((p) => p.id === proformaId)
    : null

  return (
    <aside
      className={`flex h-full w-[240px] shrink-0 flex-col border-r ${ui.border} ${ui.surface}`}
    >
      <div className={`border-b ${ui.border} px-4 py-4`}>
        <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
          Workspace
        </p>
        <h1 className="mt-1 text-[15px] font-semibold tracking-tight text-slate-900">
          Proforma
        </h1>
        {saving && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-1 text-[11px] text-violet-600"
          >
            Saving…
          </motion.p>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-2">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'mb-0.5 flex items-center gap-2.5 rounded-md px-3 py-2 text-[13px] transition-colors',
                isActive && !clientId ? ui.navActive : ui.navIdle,
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0 opacity-80" />
            {label}
          </NavLink>
        ))}

        {client && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">
              Client
            </p>
            <NavLink
              to={`/clients/${client.id}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-[12px] transition-colors',
                  isActive && !proformaId ? ui.navActive : ui.navIdle,
                )
              }
            >
              <FolderOpen className="h-3.5 w-3.5 shrink-0 text-violet-500" />
              <span className="truncate font-medium">{client.name}</span>
            </NavLink>

            {proforma && (
              <div className="mt-1 pl-2">
                <div className="flex items-center gap-1 px-2 py-0.5 text-[10px] text-slate-400">
                  <ChevronRight className="h-3 w-3" />
                  Proforma
                </div>
                <NavLink
                  to={`/clients/${client.id}/proformas/${proforma.id}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-md px-3 py-2 text-[12px] transition-colors',
                      isActive ? ui.navActive : ui.navIdle,
                    )
                  }
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                  <span className="truncate font-medium">{proforma.number}</span>
                </NavLink>
              </div>
            )}

            {!proforma && clientId && (
              <p className="px-3 pt-2 text-[11px] text-slate-400">
                Open a proforma to see it here
              </p>
            )}
          </div>
        )}
      </nav>

      <div className={`border-t ${ui.border} p-3`}>
        <p className="truncate px-2 text-[11px] text-slate-400">{username}</p>
        <button
          type="button"
          onClick={() => logout()}
          className={`mt-2 flex w-full items-center gap-2 rounded-md px-2 py-2 text-[12px] ${ui.navIdle}`}
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
